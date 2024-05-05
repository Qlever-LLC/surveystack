<template>
  <div class="qr-scanner">
    <a-btn
      ref="scannerButton"
      aria-label="Open QR Scanner"
      :x-large="!small"
      :small="!!small"
      color="primary"
      @click="startScanner()">
      <a-icon :x-large="!small" :small="!!small">mdi-qrcode-scan</a-icon>
    </a-btn>

    <a-dialog v-model="isScannerOpen" fullscreen>
      <a-card>
        <a-toolbar color="primary">
          <a-btn aria-label="Close QR Scanner" icon @click="stopScanner">
            <a-icon>mdi-close</a-icon>
          </a-btn>
          <a-toolbar-title>QR Code Scanner</a-toolbar-title>
          <a-spacer />
        </a-toolbar>
        <a-alert v-if="hasCameraError" border="start" type="error" elevation="2"> No camera detected. </a-alert>
        <a-container class="pa-0" v-if="!hasCameraError">
          <div class="video-container" ref="videoContainerElement">
            <video ref="videoElement" />
            <a-progress-circular v-if="isLoading" :width="7" :size="80" />
            <div v-if="!isLoading" class="scan-region-outline" />
          </div>
        </a-container>
      </a-card>
    </a-dialog>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import QrScanner from 'qr-scanner';

const props = defineProps({
  small: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(['codeDetected']);

const videoContainerElement = ref(null);
const videoElement = ref(null);
const isScannerOpen = ref(false);
const isLoading = ref(true);
const hasCameraError = ref(false);
let qrScanner = null;

function setScanRegionSizeCSSVar() {
  const scanRegionSize = Math.round(
    (2 / 3) * Math.min(videoElement.value.clientWidth, videoElement.value.clientHeight)
  );
  videoContainerElement.value.style.setProperty('--scan-region-size', `${scanRegionSize}px`);
}

function handleScanSuccess(result) {
  emit('codeDetected', result);
  isScannerOpen.value = false;
}

async function startScanner() {
  isScannerOpen.value = true;

  //wait a tick for the videoElement to load
  await nextTick();

  if (!videoElement.value) {
    return;
  }

  videoElement.value.addEventListener(
    'playing',
    () => {
      if (videoElement.value) {
        setScanRegionSizeCSSVar();
      }
    },
    { once: true }
  );
  qrScanner = new QrScanner(videoElement.value, handleScanSuccess);

  try {
    await qrScanner.start();
    isLoading.value = false;
  } catch (e) {
    hasCameraError.value = true;
    destroyScanner();
  }
}

function stopScanner() {
  if (qrScanner) {
    qrScanner.stop();
    destroyScanner();
  }

  isLoading.value = false;
  isScannerOpen.value = false;
}

function destroyScanner() {
  if (qrScanner) {
    qrScanner.destroy();
  }

  qrScanner = null;
}

/*onMounted(() => {
      isScannerOpen.value = true;
    });

    onUnmounted(destroyScanner);

    onBeforeUpdate(() => {
      if (isScannerOpen.value === false) {
        stopScanner();
        hasCameraError.value = false;
      }
    });

    onUpdated(async () => {
      if (isScannerOpen.value === true) {
        if (await QrScanner.hasCamera()) {
          startScanner();
        } else {
          hasCameraError.value = true;
        }
      }
    });*/
</script>

<style scoped lang="scss">
.video-container {
  position: relative;
}

.video-container video {
  width: 100%;
  height: 100%;
  display: inline-block;
}

.scan-region-outline {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: var(--scan-region-size);
  height: var(--scan-region-size);
  border: 3px solid rgb(255, 0, 255);
}

.v-progress-circular {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.v-dialog > .v-card {
  background: #222;
}
</style>
