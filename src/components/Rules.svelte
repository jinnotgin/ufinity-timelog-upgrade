<script>
  import { getContext } from "svelte";
  import moment from "moment";
  import _ from "lodash";

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ];
  const option_items = days.map(item => {
    return {
      id: item,
      text: _.startCase(_.toLower(item)),
      selected: true
    };
  });
</script>

<style>
  .dropdown-container {
    width: 200px;
    text-align: left;
  }
</style>

<section>
  <div class="dropdown-container" />
</section>
