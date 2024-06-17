<template>
  <a-dialog :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" max-width="50em">
    <a-card>
      <a-toolbar v-if="title" flat>
        <a-toolbar-title>{{ title }}</a-toolbar-title>
      </a-toolbar>

      <a-divider />

      <a-alert v-if="!loading && error" type="error" class="ma-4 d-flex justify-center">
				{{ error }}
			</a-alert>

      <a-card-text>
				<slot name="content-header" />
				<div v-if="message || $slots.default" class="d-flex justify-center align-center my-4">
					<template v-if="!hideIcon">
						<a-icon :color="iconColor">{{ icon }}</a-icon>
						<a-divider vertical class="mx-2" />
					</template>
					<div>
						<template v-if="message">
							<p v-for="(paragraph, i) of messages" :key="i" :class="{ 'mt-4': i !== 0 }">
								{{ paragraph }}
							</p>
						</template>
						<slot />
					</div>
				</div>
				<slot name="content-footer" />
			</a-card-text>

      <a-divider />

			<a-card-actions class="d-flex flex-wrap justify-end">
				<a-btn text rounded @click="open = false" :disabled="loading" v-if="showCancelButton"> Cancel </a-btn>
				<a-btn
					v-if="button"
					:color="buttonColor"
					text
					rounded
					@click="$emit('confirm')"
					:loading="loading"
					:disabled="buttonDisabled"
				>
					{{ button }}
				</a-btn>
			</a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
import { computed, defineComponent, watch } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: Boolean,
		},
		title: {
			type: String,
		},
		error: {
			type: String,
		},
		loading: {
			type: Boolean,
		},
		icon: {
			type: String,
			default: 'mdi-exclamation-thick',
		},
		iconColor: {
			type: String,
			default: 'warning',
		},
		hideIcon: {
			type: Boolean,
			default: false,
		},
		message: {
			type: [String, Array],
		},
		button: {
			type: String,
		},
		buttonColor: {
			type: String,
			default: 'green',
		},
		buttonDisabled: {
			type: Boolean,
			default: false,
		},
		showCancelButton: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['confirm', 'cleanup', 'update:modelValue', 'input'],
	setup(props, { root, emit }) {
		const open = computed({
			get: () => props.modelValue ?? false,
			set: (value) => emit('update:modelValue', value),
		});

		const messages = computed(() => (Array.isArray(props.message) ? props.message : [props.message]));

    watch(
			() => [open.value],
			([value]) => {
				if (!value) {
					emit('cleanup');
				}
			}
		);

		return {
			open,
			messages,
		};
	},
});
</script>