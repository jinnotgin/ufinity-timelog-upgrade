<script>
  import {
    projectsData,
    timelogsData,
    datesSelectedRange,
    datesSelection,
    showWeekends
  } from "../stores.js";
  import moment from "moment";
  import _ from "lodash";
  import { v4 as uuidv4 } from "uuid";
  export let saveHandler = () => {};
  export let pageDisabled;

  $: sorted_projects = _.sortBy(Object.values($projectsData), ["name"]);
  let selected_project = "296";
  let hours = 8;

  const clearDatesSelected = () => {
    $datesSelection.reset();
    datesSelection.update(_ => _);
  };

  const updateDatesSelected = () => {
    const arrayOfTimestamps = $datesSelection.toArray(true);

    if (arrayOfTimestamps.length === 0) return false;

    const future_timelogsData = _.clone($timelogsData);
    for (let currentSlot of arrayOfTimestamps) {
      const currentMoment = moment(currentSlot)
        .utc()
        .startOf("day");
      const currentIso = currentMoment.toISOString();

      if (!!!$showWeekends && [0, 6].includes(currentMoment.day())) continue;

      if (typeof future_timelogsData.client.data[currentIso] === "undefined")
        future_timelogsData.client.data[currentIso] = {};

      const existingData = _.get(
        $timelogsData,
        `server.data["${currentIso}"]["${selected_project}"]`,
        false
      );

      // console.log(currentIso);
      future_timelogsData.client.data[currentIso][`${selected_project}`] = {
        projectId: `${selected_project}`,
        date: !!existingData ? existingData.date : currentMoment.clone(),
        hours: `${hours}`,
        id: !!existingData ? `${existingData.id}` : uuidv4()
      };
    }
    // console.log(future_timelogsData);
    timelogsData.update(_ => future_timelogsData);
    console.log($timelogsData);
  };

  const saveClickHandler = () => {
    clearDatesSelected();
    saveHandler();
  };
</script>

<style>
  .container {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  .divider {
    margin: 0 0.5em;
  }
</style>

<div class="container" class:pageDisabled>
  <select bind:value={selected_project} disabled={pageDisabled}>
    {#each sorted_projects as { id, name } (id)}
      <option value={id} selected={id === selected_project}>{name}</option>
    {/each}
  </select>
  <div class="divider" />
  <label>
    <input
      type="number"
      bind:value={hours}
      min="0"
      max="16"
      disabled={pageDisabled} />
    <input
      type="range"
      bind:value={hours}
      min="0"
      max="16"
      disabled={pageDisabled} />
  </label>
  <div class="divider" />
  <button on:click={updateDatesSelected} disabled={pageDisabled}>Apply</button>
  <div class="divider" />
  <button on:click={clearDatesSelected} disabled={pageDisabled}>Clear</button>
  <div class="divider" />
  <button on:click={saveClickHandler} disabled={pageDisabled}>Save</button>
</div>
