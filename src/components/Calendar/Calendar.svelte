<script>
  import moment from "moment";
  import _ from "lodash";
  import Day from "./Day.svelte";
  import Switch from "../Switch.svelte";
  import {
    calendarView,
    projectsData,
    timelogsData,
    datesSelection,
    showWeekends,
    uncommittedProjectsPerDay,
    calendarView_changeMonth
  } from "../../stores.js";
  import { setContext } from "svelte";
  export let pageDisabled;

  const dateType = date => {
    const dateIsSelected = $datesSelection.exists(date.valueOf());

    const dateIsARelevantDay = dragData.relevantHoverDays.includes(date.day());
    const dateIsARelevantWeek = dragData.relevantHoverWeeks.includes(
      date.week()
    );

    // const check_forwardLinking =
    //   dragData.dateDirection === "forward" &&
    //   date.isSameOrAfter(dragData.startDate) &&
    //   date.isSameOrBefore(dragData.hoverDate);

    // const check_backwardLinking =
    //   dragData.dateDirection === "backward" &&
    //   date.isSameOrBefore(dragData.startDate) &&
    //   date.isSameOrAfter(dragData.hoverDate);

    if (
      dragData.isDragging &&
      dateIsARelevantDay &&
      // (check_forwardLinking || check_backwardLinking)
      dateIsARelevantWeek
    )
      return "light";
    else if (dateIsSelected) return "active";
    else return false;
  };

  let datesToRender = [];
  const generate_datesToRender = () => {
    const { startDate, endDate } = $calendarView;
    const isLoading = $timelogsData.server.fetching;

    const new_datesToRender = [];
    uncommittedProjectsPerDay.update(_ => []);

    dragData.pendingSelection = [];
    for (
      let currentDate = startDate.clone();
      currentDate.isSameOrBefore(endDate);
      currentDate.add(1, "days")
    ) {
      if (!!!$showWeekends && [0, 6].includes(currentDate.day())) continue;

      const currentDate_iso = currentDate.toISOString();
      const clientData = _.get(
        $timelogsData,
        `client.data["${currentDate_iso}"]`,
        {}
      );

      const currentDate_type = dateType(currentDate);
      if (currentDate_type === "light")
        dragData.pendingSelection.push(currentDate.clone());

      const output = {
        isLoading,
        date: currentDate.clone(),
        type: currentDate_type,
        events: Object.values(clientData).map(item => {
          const clientDifferentFromServer = !_.isEqual(
            _.get(
              $timelogsData,
              `client.data["${currentDate_iso}"]["${item.projectId}"]`,
              {}
            ),
            _.get(
              $timelogsData,
              `server.data["${currentDate_iso}"]["${item.projectId}"]`,
              {}
            )
          );

          if (clientDifferentFromServer)
            uncommittedProjectsPerDay.update(currentArray => [
              ...currentArray,
              { dateIso: currentDate_iso, projectId: `${item.projectId}` }
            ]);

          return {
            ...item,
            projectName: _.get($projectsData, `["${item.projectId}"].name`, ""),
            uncommitted: clientDifferentFromServer
          };
        })
      };
      console.log(_.clone(dragData.pendingSelection));
      output.isSaving = output.events
        .map(item => _.get(item, "fetching", false))
        .includes(true);
      // console.log(output);
      new_datesToRender.push(output);
    }
    // console.log(new_datesToRender);
    // console.log($uncommittedProjectsPerDay);
    datesToRender = [...new_datesToRender];
  };

  $: ($calendarView ||
    $showWeekends ||
    dragData.hoverDate ||
    $datesSelection.selection ||
    $timelogsData) &&
    generate_datesToRender();

  $: daysToRender = [
    $showWeekends && "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    $showWeekends && "SAT"
  ].filter(item => item);

  const dragData = {};
  const reset_dragData = () => {
    dragData.isDragging = false;
    dragData.startDate = false;
    dragData.endDate = false;
    dragData.dateDirection = "forward";
    dragData.hoverDate = false;
    dragData.relevantHoverDays = [];
    dragData.relevantHoverWeeks = [];
    dragData.pendingSelection = [];
  };
  reset_dragData();

  const processRelevantDays_dragData = () => {
    let { startDate = false, hoverDate = false } = dragData;
    if (!!!startDate || !!!hoverDate) return false;

    const startDay = startDate.day();
    const endDay = hoverDate.day();

    const output_hoverDays = [];
    for (
      let i = startDay;
      endDay < startDay ? i >= endDay : i <= endDay;
      endDay < startDay ? i-- : i++
    ) {
      output_hoverDays.push(i);
    }
    dragData.relevantHoverDays = output_hoverDays;

    const startWeek = startDate.week();
    const endWeek = hoverDate.week();
    const output_hoverWeeks = [];
    for (
      let i = startWeek;
      endWeek < startWeek ? i >= endWeek : i <= endWeek;
      endWeek < startWeek ? i-- : i++
    ) {
      output_hoverWeeks.push(i);
    }
    dragData.relevantHoverWeeks = output_hoverWeeks;

    // console.log(dragData.relevantHoverDays, dragData.relevantHoverWeeks);
    return true;
  };

  const process_dragData = () => {
    /*let { startDate = false, endDate = false } = dragData;
    if (!!startDate && !!endDate) {
      for (
        let i = startDate.clone();
        dragData.dateDirection === "backward"
          ? i.isSameOrAfter(endDate)
          : i.isSameOrBefore(endDate);
        dragData.dateDirection === "backward"
          ? i.subtract(1, "days")
          : i.add(1, "days")
      ) {
        if (!dragData.relevantHoverDays.includes(i.day())) continue;
        // if (!!!$showWeekends && [0, 6].includes(i.day())) continue;

        $datesSelection.toggle(i.valueOf());
      }
    }*/
    for (let currentDate of dragData.pendingSelection) {
      console.log(currentDate);
      $datesSelection.toggle(currentDate.valueOf());
    }
    datesSelection.update(_ => _);
    reset_dragData();
  };

  const handleMessage = event => {
    if (pageDisabled) return false;

    switch (event.detail.type) {
      case "mouseDown": {
        const { date = false } = event.detail;
        // console.log("mouseDown", date);
        dragData.startDate = date;
        break;
      }
      case "mouseUp": {
        const { date = false } = event.detail;
        // console.log("mouseUp", date);
        dragData.endDate = date;
        // console.log(dragData);
        processRelevantDays_dragData();
        process_dragData();
        break;
      }
      case "mouseEnter": {
        const { date = false } = event.detail;
        // console.log(date.format());
        dragData.hoverDate = date;
        dragData.dateDirection = date.isSameOrAfter(dragData.startDate)
          ? "forward"
          : "backward";
        processRelevantDays_dragData();
        // console.log(dragData.relevantHoverDays);
        // console.log(dragData.hoverDate);
        break;
      }
      case "mouseLeave": {
        dragData.hoverDate = false;
        // console.log(dragData.hoverDate);
        break;
      }
      case "click": {
        const { date = false } = event.detail;
        $datesSelection.toggle(date.valueOf());
        datesSelection.update(_ => _);
        break;
      }
      default: {
        console.log("Why got weird case one?");
      }
    }
  };

  const increment = () => {
    calendarView_changeMonth($calendarView, "increase");
  };
  const decrement = () => {
    calendarView_changeMonth($calendarView, "decrease");
  };
</script>

<style type="text/scss">
  .container {
    /*max-width: 1020px;*/
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }
  .header {
    user-select: none;
    text-align: center;
    padding: 1rem 1rem;
    background: rgba(var(--color-primary-hex), 0.9);
    color: var(--color-white);
    font-size: 2rem;
    display: flex;
    justify-content: center;
    .button {
      cursor: pointer;
      padding: 0 0.45em;
    }
    .button:hover {
      background-color: rgba(var(--color-secondary-hex), 0.4);
      border-radius: 50%;
    }
    .title {
      width: 200px;
    }
    .leftPadding,
    .rightPadding {
      flex: 1;
    }
    .rightPadding {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  }
  .calendar {
    display: flex;
    flex-direction: column;
  }
  .dayName-container,
  .day-grid {
    display: grid;
    gap: 1px;
    grid-template-columns: repeat(5, minmax(50px, 1fr));
    grid-template-rows: auto 1fr;
  }
  .calendar.showWeekends {
    .dayName-container,
    .day-grid {
      grid-template-columns: repeat(7, minmax(50px, 1fr));
    }
  }
  .dayName-container {
    border: 1px solid var(--color-white);
    background: var(--color-white);
  }
  .day-grid {
    border: 1px solid var(--color-grey);
    background: var(--color-grey);
  }
</style>

<div class="container">
  <div class="header">
    <div class="leftPadding" />
    <div class="button" on:click={decrement}>
      <span>L</span>
    </div>
    <div class="title">
      <span>{$calendarView.month.format('MMM Y')}</span>
    </div>
    <div class="button" on:click={increment}>
      <span>R</span>
    </div>
    <div class="rightPadding">
      <Switch label="Weekends" bind:checked={$showWeekends} />
    </div>
  </div>

  <div
    class="calendar"
    class:showWeekends={$showWeekends}
    on:mousedown={() => (dragData.isDragging = true)}
    on:mouseup={() => (dragData.isDragging = false)}>
    <div class="dayName-container">
      {#each daysToRender as item, i (`${item}_${i}`)}
        <div class="dayName">{item}</div>
      {/each}
    </div>
    <div class="day-grid">
      {#each datesToRender as { isLoading, date, type, events, isSaving } (date.valueOf())}
        <Day
          disabled={pageDisabled}
          {date}
          {type}
          {events}
          {isLoading}
          {isSaving}
          on:message={handleMessage} />
      {/each}
    </div>
  </div>
</div>
