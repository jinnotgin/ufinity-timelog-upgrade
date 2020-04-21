<script>
  import { createEventDispatcher } from "svelte";
  import moment from "moment";
  import Skeleton from "../Skeleton.svelte";
  export let date, type, events, isLoading, isSaving, disabled;

  const isToday = moment()
    .startOf("day")
    .isSame(date);

  const dispatch = createEventDispatcher();

  const dispatchMsg = name => {
    dispatch("message", {
      type: name,
      date
    });
  };
</script>

<style type="text/scss">
  .background {
    background: var(--color-white);
  }

  .container {
    background: var(--color-white);
    transition: background-color 100ms linear;
    user-select: none;
    min-height: 60px;
    height: 100%;
    cursor: pointer;
    .contents {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 0.5em;
      .date {
        text-align: right;
      }
      .event {
        text-align: left;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
      .event.uncommitted {
        color: var(--color-danger);
        font-weight: 500;
      }
    }
  }
  .container.isToday {
    background: rgba(var(--color-info-hex), 0.5);
  }
  .container.active {
    background: rgba(var(--color-primary-hex), 0.8);
    color: var(--color-white);
  }
  .container.light {
    background: rgba(var(--color-secondary-hex), 0.5);
  }
  .container:hover {
    background: rgba(var(--color-primary-hex), 0.5);
  }

  .background.disabled {
    .container {
      cursor: not-allowed;
      background: var(--color-lightgrey);
    }
    .container.isSaving {
      background: rgba(var(--color-danger-hex), 0.5);
    }
  }
</style>

<div class="background" class:disabled>
  <div
    class="container"
    class:active={type === 'active'}
    class:light={type === 'light'}
    class:isToday
    class:isSaving
    on:click={() => dispatchMsg('click')}
    on:mousedown={() => dispatchMsg('mouseDown')}
    on:touchstart={() => dispatchMsg('mouseDown')}
    on:mouseup={() => dispatchMsg('mouseUp')}
    on:touchend={() => dispatchMsg('mouseUp')}
    on:mouseenter={() => dispatchMsg('mouseEnter')}
    on:touchmove={() => dispatchMsg('mouseEnter')}
    on:mouseleave={() => dispatchMsg('mouseLeave')}>
    <div class="contents">
      <span class="date">
        <strong>{date.date()}</strong>
      </span>
      {#if isLoading}
        <Skeleton />
      {/if}
      {#each events as { id, projectName, hours, uncommitted } (id)}
        <span class="event" class:uncommitted title={projectName}>
          {hours}h {projectName}
        </span>
      {/each}
    </div>
  </div>
</div>
