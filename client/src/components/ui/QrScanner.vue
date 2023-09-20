<template>
  <div class="qr-scanner">
    <v-btn
      ref="scannerButton"
      aria-label="Open QR Scanner"
      :x-large="!small"
      :small="!!small"
      dark
      color="primary"
      @click="isScannerOpen = true"
    >
      <a-icon :x-large="!small" :small="!!small">mdi-qrcode-scan</a-icon>
    </v-btn>

    <v-dialog v-model="isScannerOpen" fullscreen>
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn aria-label="Close QR Scanner" icon dark @click="isScannerOpen = false">
            <a-icon>mdi-close</a-icon>
          </v-btn>
          <v-toolbar-title>QR Code Scanner</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-alert v-if="hasCameraError" border="left" colored-border type="error" elevation="2">
          No camera detected.
        </v-alert>
        <v-container class="pa-0" v-if="!hasCameraError">
          <div class="video-container" ref="videoContainerElement">
            <video ref="videoElement" />
            <v-progress-circular
              v-if="isLoading"
              indeterminate
              :width="7"
              :size="80"
              color="primary"
            ></v-progress-circular>
            <div v-if="!isLoading" class="scan-region-outline" />
          </div>
        </v-container>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { defineComponent, onBeforeUpdate, onUnmounted, onUpdated, ref } from '@vue/composition-api';
import QrScanner from 'qr-scanner';
/* eslint-disable import/no-webpack-loader-syntax, import/extensions */
import qrScannerWorkerSource from '!!raw-loader!@/../node_modules/qr-scanner/qr-scanner-worker.min.js';
import AIcon from '@/components/ui/AIcon.vue';

QrScanner.WORKER_PATH = URL.createObjectURL(new Blob([qrScannerWorkerSource], { type: 'application/javascript' }));

export default defineComponent({
  components: { AIcon },
  emits: ['codeDetected'],
  props: {
    small: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, { emit }) {
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

    function destroyScanner() {
      if (qrScanner) {
        qrScanner.destroy();
      }

      qrScanner = null;
    }

    async function startScanner() {
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

      if (qrScanner === null) {
        qrScanner = new QrScanner(videoElement.value, handleScanSuccess);
      }

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
      }

      isLoading.value = true;
    }

    function click() {
      isScannerOpen.value = true;
    }

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
    });

    return {
      videoElement,
      videoContainerElement,
      isScannerOpen,
      isLoading,
      hasCameraError,
      click,
    };
  },
});
</script>

<style scoped>
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
