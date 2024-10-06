<script>
  import { onMount, tick } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { quartInOut } from 'svelte/easing';
  import mapImgJpg from '$lib/images/map.jpg'
  import mapImgAvif from '$lib/images/map.avif'

  // const TOTAL_DISTANCE = 282;
  const TOTAL_DISTANCE = 1718;

  let dailyStats = $state([]);
  let distanceTraveled = $state(0);
  let loading = $state(true);
  let error = $state(null);

  let frodoPath = $state(null);
  let marker = $state(null);

  // Create a tweened store for the animation
  const animatedDistance = tweened(0, {
    duration: 5000,
    easing: quartInOut
  });

  onMount(async () => {
    if (distanceTraveled) return;

    try {
      const response = await fetch('/api/sheets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();

      dailyStats = data.dailyStats;
      distanceTraveled = data.distanceTraveled || 0;

      // Wait for the next tick to ensure the SVG elements are mounted
      await tick();

      // Start the animation
      animatedDistance.set(distanceTraveled);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  $effect(() => {
    updateMarkerPosition($animatedDistance);
  });

  function updateMarkerPosition(currentDistance) {
    if (!frodoPath || !marker) return;
    
    const svgPathLength = frodoPath.getTotalLength();
    const markerPosition = frodoPath.getPointAtLength((svgPathLength * currentDistance) / TOTAL_DISTANCE);
    marker.setAttribute(
      "transform",
      `translate(${markerPosition.x - 431} ${markerPosition.y - 318})`
    );
  }

  function prettyPrintDate(dateString) {
    const date = new Date(dateString);

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);

    return formattedDate
  }
</script>

<div class="wrap">
  <div class="container">
    <div class="hud">
      {#if loading}
        <p>Loading...</p>
      {:else if error}
        <p>Error: {error}</p>
      {:else}
        <span>Start date:</span>
        <strong>{prettyPrintDate(dailyStats[0].date)}</strong>
        <span>Miles total:</span>
        <strong>{TOTAL_DISTANCE}</strong>
        <span>Miles traveled:</span>
        <strong>{distanceTraveled}</strong>
        <span>Miles remaining:</span>
        <strong>{TOTAL_DISTANCE - distanceTraveled}</strong>
      {/if}
    </div>

    <picture>
      <source srcset={mapImgAvif} type="image/avif" />
      <img src={mapImgJpg} alt="Map" />
    </picture>
    <svg
      viewBox="0 0 1252 1009"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        bind:this={frodoPath}
        id="frodo-path"
        d="M431.501 314.999C425.001 320.999 435 323 437.5 325C440 327 437.001 331.999 440.501 333.499C444.001 334.999 452.001 333.499 460.501 341.499C469.001 349.499 479.001 348.499 483.001 343.499C487.001 338.499 476.001 318 490.001 311.999C502.375 306.696 494.001 285 507.001 274.5C520.001 264 524.078 225.768 561.001 234.999C583.001 240.5 585.229 258.722 608.001 261.499C628.501 264 641.001 249.999 664.501 252.999C689.305 256.166 705.501 289.499 658.501 334.499C611.501 379.499 586 405 601.5 419.5C622.402 439.054 646.227 371.499 701.501 371.499C725.501 371.499 748.501 384.499 741.501 397.499C734.501 410.499 749.501 405.999 749.501 412.499C749.501 418.999 763.001 425.719 772.501 427.999C782.001 430.279 782.001 443.499 770.501 445.499C763.178 446.773 762.001 456.999 772.501 455.499C788.004 453.284 778.501 469.499 795.001 469.499C806.012 469.499 885.501 459.499 875.001 486.499C864.501 513.499 847.501 576.999 866.001 632.499C881.001 677.5 897 664 933.5 677.5C970 691 968 648 983.001 627.999"
      />
      <path
        bind:this={marker}
        id="marker"
        d="M431 296.468C431.825 296.468 432.531 296.185 433.119 295.618C433.706 295.051 434 294.37 434 293.574C434 292.779 433.706 292.098 433.119 291.531C432.531 290.964 431.825 290.681 431 290.681C430.175 290.681 429.469 290.964 428.881 291.531C428.294 292.098 428 292.779 428 293.574C428 294.37 428.294 295.051 428.881 295.618C429.469 296.185 430.175 296.468 431 296.468ZM431.561 314.825C431.334 315.284 430.666 315.284 430.439 314.825C427.515 308.895 423.847 304.391 421.981 301.731C419.994 298.898 419 296.275 419 293.864C419 290.247 420.206 287.365 422.619 285.219C425.031 283.073 427.825 282 431 282C434.175 282 436.969 283.073 439.381 285.219C441.794 287.365 443 290.247 443 293.864C443 296.275 442.006 298.898 440.019 301.731C438.153 304.391 434.485 308.895 431.561 314.825Z"
      />
    </svg>
  </div>
</div>

<style>
  .wrap {
    /* height: 100svh; */
    padding: 20px;
  }

  .container {
    position: relative;
    height: 100%;

    .hud {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 3;
      padding: 10px 16px;
      background-color: var(--dark);
      border-radius: 14px;
      outline: 3px solid hsl(0 0% 0% / 0.2);
      color: hsl(56, 29%, 66%);
      font-family: "Courier New", Courier, monospace;
      box-shadow: 0 8px 18px -6px hsl(0 0% 0% / 1);
      font-size: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      row-gap: 6px;
      column-gap: 8px;
    }

    img {
      display: block;
      max-height: 100%;
      max-width: 100%;
      border-radius: 22px;
      box-shadow: 0 14px 18px -10px hsl(0 0% 0% / 0.5);
    }

    svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: auto;

      #frodo-path {
        stroke-dasharray: 10;
        stroke-width: 3px;
        stroke-linecap: round;
        stroke: var(--yellow);
        filter: drop-shadow(0px 0px 3px hsl(24, 100%, 50%));
      }

      #marker {
        fill: hsl(40, 100%, 50%);
        filter: drop-shadow(0px 0px 3px hsl(24, 100%, 17%));
        stroke: hsl(0, 0%, 100%);
        stroke-width: 2px;
      }
    }
  }
</style>
