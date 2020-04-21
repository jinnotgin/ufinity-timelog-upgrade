<script>
  import _ from "lodash";
  import moment from "moment";
  import { v4 as uuidv4 } from "uuid";
  import Calendar from "./components/Calendar/Calendar.svelte";
  import Editor from "./components/Editor.svelte";
  import Rules from "./components/Rules.svelte";
  import { getProjectsData, getTimelogsData, saveTimelog } from "./api.js";
  import {
    projectsData,
    timelogsData,
    timelogAutoRules,
    daysWithAutoRule,
    uncommittedProjectsPerDay
  } from "./stores.js";
  import { timelogAutoRules_getRule, timelog_saving } from "./utils.js";

  let pageDisabled = false;

  const saveUncommittedChanges = async () => {
    // console.log($uncommittedProjectsPerDay);
    // console.log($timelogsData.client.data);
    pageDisabled = true;

    for (let { dateIso, projectId } of $uncommittedProjectsPerDay) {
      console.log({ dateIso, projectId });
      const serverData = _.get(
        $timelogsData,
        `server.data["${dateIso}"]["${projectId}"]`,
        false
      );
      const clientData = $timelogsData.client.data[dateIso][projectId];
      const isAnUpdate = !!serverData;

      // console.log({ serverData, clientData, isAnUpdate });

      const { hours } = clientData;

      timelog_saving(timelogsData, $timelogsData, {
        action: "saving",
        dateIso,
        projectId
      });
      const response = await saveTimelog({
        action: isAnUpdate ? "update" : "create",
        id: isAnUpdate ? `${serverData.id}` : "",
        projectId,
        dateIso,
        hours
      });

      if (response) {
        timelog_saving(
          timelogsData,
          $timelogsData,
          {
            action: "saveSuccess",
            dateIso,
            projectId
          },
          `${response}`
        );
      } else {
        timelog_saving(timelogsData, $timelogsData, {
          action: "saveFailure",
          dateIso,
          projectId
        });
      }

      console.log(response);
    }

    pageDisabled = false;
  };

  const applyAutoRules = clientData => {
    // apply auto rules
    const future_clientData = _.cloneDeep(clientData);

    // now move backwards until the last know date
    for (
      let currentMoment = moment.utc().startOf("day");
      typeof future_clientData[currentMoment.toISOString()] === "undefined";
      currentMoment.subtract(1, "days")
    ) {
      const current_iso = currentMoment.toISOString();
      // console.log("adding for", current_iso);
      const autoTransactions = timelogAutoRules_getRule(
        $timelogAutoRules,
        currentMoment
      );

      if (autoTransactions.length > 0) {
        daysWithAutoRule.update(item => [...item, currentMoment]);

        future_clientData[current_iso] = {};
        for (let intent of autoTransactions) {
          const { projectId, hours } = intent;
          const uuid = uuidv4();

          future_clientData[current_iso][projectId] = {
            projectId,
            date: currentMoment.clone(),
            hours: hours,
            id: uuid
          };
        }
      }
    }

    return future_clientData;
  };

  // get data from backend
  getProjectsData().then(data => {
    // console.log(data);
    projectsData.update(item => data);
  });
  setTimeout(() => {
    getTimelogsData().then(data => {
      // console.log(data);

      const data_afterApplyingAutoRules = applyAutoRules(data);

      timelogsData.update(item => {
        return {
          server: {
            fetching: false,
            data,
            updateTime: false
          },
          client: {
            data: data_afterApplyingAutoRules,
            updateTime: false
          }
        };
      });
      // console.log($timelogsData);
    });
  }, 1500);

  export let name;
</script>

<style type="text/scss">
  :global(:root) {
    --color-primary-hex: 10, 55, 88;
    --color-secondary-hex: 60, 153, 152;
    --color-info-hex: 255, 218, 164;
    --color-danger-hex: 223, 115, 86;
    /* 223, 115, 86*/
    --color-primary: rgba(var(--color-primary-hex), 1);
    --color-secondary: rgba(var(--color-secondary-hex), 1);
    --color-info: rgba(var(--color-info-hex), 1);
    --color-danger: rgba(var(--color-danger-hex), 1);
    --color-grey: rgb(96, 95, 94);
    --color-lightgrey: rgb(240, 240, 240);
    --color-white: rgb(252, 252, 252);
  }

  main {
    text-align: center;
    padding: 1em;
    /*max-width: 240px;*/
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
    margin: 0;
  }

  p {
    font-size: 2rem;
  }

  /*@media (min-width: 640px) {
    main {
      max-width: none;
    }
  }*/
</style>

<main>
  <h1>{name}</h1>
  <p>
    You have
    <strong>{$uncommittedProjectsPerDay.length} unsaved changes.</strong>
    Please save to confirm them.
  </p>
  <Calendar {pageDisabled} />
  <br />
  <Editor saveHandler={saveUncommittedChanges} {pageDisabled} />
  <Rules />
  <br />
  <span>Active AutoRules: {JSON.stringify($timelogAutoRules)}</span>
</main>
