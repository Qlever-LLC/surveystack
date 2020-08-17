<template>
  <div class="d-flex">
    <div v-if="control.title" class="mb-2">{{ control.title }}</div>
    <div>
      {{ control.label }}
    </div>
      <div
        class="map-container my-2"
        v-if="!mapError"
      >
        <app-gps
          class="gps-info"
          :expanded="false"
          :location="currentLocation.location"
        >
          {{ currentLocation.label }}
        </app-gps>
        <div
          style="background-color: #000"
          :id="`map-question-${index}`"
          class="map-question"
          v-if="!mapError"
        >
          <img
            v-if="!this.value"
            id="map-marker"
            src="@/assets/marker.svg"
            alt="marker"
          />
          <div class="selection-controls d-flex justify-center">
            <div v-if="!location">
              <v-btn
                large
                class="mx-4 full"
                color="gray"
                @click="skip"
              >
                Skip
              </v-btn>
              <v-btn
                large
                :disabled="disablePick"
                :dark="!disablePick"
                class="mx-4 full"
                color="primary"
                @click="pickLocation"
              >
                Pick
              </v-btn>
            </div>
            <div v-else>
              <v-btn
                large
                class="mx-4 full"
                color="gray"
                @click="retake"
              >
                Retake
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <div
        id="map-error-alert"
        class="my-4"
        v-else
      >
        <v-alert
          type="info"
          border="right"
          prominent
        >
          Error loading map. Unable to load map. Using GPS coordinates.
        </v-alert>
        <app-gps
          :expanded="true"
          :location="currentLocation.location"
        >
          {{ currentLocation.label }}
        </app-gps>
      </div>

      <v-container
        class="map-footer infos grey--text text--darken-2 text-center"
        fluid
      >
        <v-container v-if="!gps">
          <v-row
            class="fill-height"
            align-content="center"
            justify="center"
          >
            <v-col
              class="subtitle-1 text-center"
              cols="12"
            >
              Getting GPS Coordinates
            </v-col>
            <v-col cols="6">
              <v-progress-linear
                color="red accent-4"
                indeterminate
                rounded
                height="6"
              ></v-progress-linear>
            </v-col>
          </v-row>
        </v-container>

      </v-container>
      <div v-if="control.hint" class="mt-4 mb-0">{{ control.hint }}</div>
  </div>
</template>

<script src="./Location.js"></script>

<style scoped src="./Location.css"></style>
