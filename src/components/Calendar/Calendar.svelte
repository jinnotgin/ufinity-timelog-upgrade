<script>
  import moment from "moment";
  import _ from "lodash";
  import Day from "./Day.svelte";
  import Switch from "../Switch.svelte";
  import {
    calendarView,
    projectsData,
    timelogsData,
    datesSelectedRange,
    showWeekends,
    uncommittedProjectsPerDay,
    calendarView_changeMonth
  } from "../../stores.js";
  import { setContext } from "svelte";
  export let pageDisabled;

  let dateHovered = false;

  const dateType = date => {
    const twoDatesSelected_within =
      $datesSelectedRange.length === 2 &&
      date.isSameOrAfter($datesSelectedRange[0]) &&
      date.isSameOrBefore($datesSelectedRange[1]);

    const oneDateSelected_sameDay =
      $datesSelectedRange.length === 1 && date.isSame($datesSelectedRange[0]);

    const oneDateSelected_hover =
      $datesSelectedRange.length === 1 &&
      dateHovered &&
      date.isAfter($datesSelectedRange[0]) &&
      date.isSameOrBefore(dateHovered);

    if (twoDatesSelected_within || oneDateSelected_sameDay) return "active";
    else if (oneDateSelected_hover) return "light";
    else return false;
  };

  let datesToRender = [];
  const generate_datesToRender = () => {
    const { startDate, endDate } = $calendarView;
    const isLoading = $timelogsData.server.fetching;

    const new_datesToRender = [];
    uncommittedProjectsPerDay.update(_ => []);
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

      const output = {
        isLoading,
        date: currentDate.clone(),
        type: dateType(currentDate),
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
    dateHovered ||
    $datesSelectedRange ||
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

  const handleMessage = event => {
    if (pageDisabled) return false;

    switch (event.detail.type) {
      case "mouseEnter": {
        const { date = false } = event.detail;
        dateHovered = date;
        // console.log(dateHovered);
        break;
      }
      case "mouseLeave": {
        dateHovered = false;
        // console.log(dateHovered);
        break;
      }
      case "click": {
        const { date = false } = event.detail;
        let future_dateSelectedRange = _.clone($datesSelectedRange);

        const hasStartingSelectedDate =
          $datesSelectedRange.length === 1 &&
          moment.isMoment($datesSelectedRange[0]);

        const date_afterFirstClicked =
          hasStartingSelectedDate && date.isAfter($datesSelectedRange[0]);
        if (
          !!!date ||
          $datesSelectedRange.length >= 2 ||
          !date_afterFirstClicked
        )
          future_dateSelectedRange = [];

        const date_sameAsFirstClicked =
          hasStartingSelectedDate && date.isSame($datesSelectedRange[0]);
        if (!date_sameAsFirstClicked) future_dateSelectedRange.push(date);

        // console.log(
        //   future_dateSelectedRange.map(item => item.toISOString().split("T")[0])
        // );
        datesSelectedRange.update(item => future_dateSelectedRange);
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

  <div class="calendar" class:showWeekends={$showWeekends}>
    <div class="dayName-container">
      {#each daysToRender as item, i (`${item}_${i}`)}
        <div class="dayName">{item}</div>
      {/each}
    </div>
    <div class="day-grid">
      {#each datesToRender as { isLoading, date, type, events, isSaving } (date.unix())}
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
