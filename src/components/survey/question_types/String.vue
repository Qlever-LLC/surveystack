<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
    />

    <div style="display: flex">
      <div style="flex: 1">
        <v-text-field
          outlined
          :label="control.hint"
          v-bind:value="value"
          v-on:input="onInput"
          @keyup.enter.prevent="submit"
          ref="textField"
          class="full-width"
          :disabled="!relevant"
          hide-details
        />
      </div>
      <div
        style="flex: 0"
        class="ml-4"
        v-if="control.options.enableQr"
        @click="isScannerOpen = true"
      >
        <v-btn dark color="primary" x-large><v-icon>mdi-qrcode</v-icon></v-btn>
      </div>
    </div>
    <app-control-more-info :value="control.moreInfo" />

    <v-dialog v-model="isScannerOpen" fullscreen>
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn
            aria-label="Close QR Scanner"
            icon
            dark
            @click="isScannerOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>QR Code Scanner</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-alert
          v-if="hasCameraError"
          border="left"
          colored-border
          type="error"
          elevation="2"
        >
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
/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable import/extensions */

import QrScanner from 'qr-scanner';
import baseQuestionComponent from './BaseQuestionComponent';
import { isIos } from '@/utils/compatibility';

import { getValueOrNull } from '@/utils/surveyStack';

import qrScannerWorkerSource from '!!raw-loader!../../../../node_modules/qr-scanner/qr-scanner-worker.min.js';

QrScanner.WORKER_PATH = URL.createObjectURL(
  new Blob([qrScannerWorkerSource], { type: 'application/javascript' }),
);

export default {
  mixins: [baseQuestionComponent],
  data() {
    return {
      isScannerOpen: false,
      isLoading: true,
      hasCameraError: false,
      qrScanner: null,
    };
  },
  methods: {
    getValueOrNull,
    submit() {
      this.onInput(this.value);
      this.$emit('next');
    },
    onInput(v) {
      if (this.value !== v) {
        this.changed(getValueOrNull(v));
      }
    },
    tryAutofocus() {
      if (
        typeof document === 'undefined'
        || !this.$refs.textField.$refs.input
        || document.activeElement === this.$refs.input
      ) {
        return false;
      }

      this.$refs.textField.$refs.input.focus({ preventScroll: true });

      // could we use this instead?
      // this.$nextTick(() => this.$refs.textField.$refs.input.focus());

      return true;
    },
    setScanRegionSizeCSSVar() {
      const scanRegionSize = Math.round(
        (2 / 3)
          * Math.min(
            this.$refs.videoElement.clientWidth,
            this.$refs.videoElement.clientHeight,
          ),
      );
      this.$refs.videoContainerElement.style.setProperty(
        '--scan-region-size',
        `${scanRegionSize}px`,
      );
    },
    destroyScanner() {
      if (!this.qrScanner) {
        return;
      }
      this.qrScanner.destroy();
      this.qrScanner = null;
    },
    async startScanner() {
      if (!this.$refs.videoElement || !this.$refs.videoElement) {
        return;
      }

      this.$refs.videoElement.addEventListener(
        'playing',
        () => {
          if (this.$refs.videoElement) {
            this.setScanRegionSizeCSSVar();
          }
        },
        { once: true },
      );

      if (this.qrScanner === null) {
        this.qrScanner = new QrScanner(
          this.$refs.videoElement,
          (result) => {
            this.onInput(result);
            this.isScannerOpen = false;
          },
        );
      }

      try {
        await this.qrScanner.start();
        this.isLoading = false;
      } catch (e) {
        this.hasCameraError = true;
        this.destroyScanner();
      }
    },
    stopScanner() {
      if (!this.qrScanner) {
        return;
      }
      this.qrScanner.stop();
      this.isLoading = true;
    },
  },
  mounted() {
    if (this.autoFocus) {
      if (isIos()) {
        this.$el.style.transform = 'translateY(-1000px)';
        this.tryAutofocus();
        this.$el.scrollTo(0, 0);
        this.$el.style.transform = 'none';
      } else {
        this.tryAutofocus();
      }
    }
  },
  destroyed() {
    this.destroyScanner();
  },
  beforeUpdate() {
    if (this.isScannerOpen === false) {
      this.stopScanner();
      this.hasCameraError = false;
    }
  },
  async updated() {
    console.log('updated()');
    if (this.isScannerOpen === true) {
      if (await QrScanner.hasCamera()) {
        console.log('starting scanner');
        this.startScanner();
      } else {
        console.log('error, hasCamera is false');
        this.hasCameraError = true;
      }
    }
  },
};
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
