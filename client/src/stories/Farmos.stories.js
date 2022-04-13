import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import FarmosRegister from '../pages/farmos-manage/FarmOSRegister.vue';
import { action } from '@storybook/addon-actions';

export default {
  title: 'FarmOS Register Page',
  component: FarmosRegister,
  argTypes: { checkUrl: { action: 'checkUrl' }, createInstance: { action: 'createInstance' } },
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { FarmosRegister },
  template: '<farmos-register :viewModel="viewModel" @check-url="checkUrl" @create-instance="createInstance"/>',
});

export const SuperAdminInterface = Template.bind({});

SuperAdminInterface.args = {
  viewModel: {
    form: {
      instanceName: 'oursci.surveystack.dev',
      instanceNameValid: true,
      email: '',
      fullName: '',
      farmName: '',
      farmAddress: '',
      units: '',
      timezone: '',
      agree: false,
      owner: null,
      admins: [],
    },
    groups: [
      {
        name: 'BFA',
        id: '123',
      },
    ],
    plans: ['farmos-surveystack', 'farmos-regen'],
    users: [
      {
        email: 'user1@test.com',
        name: 'User 1',
        id: 'u1',
      },
      {
        email: 'user2@test.com',
        name: 'User 2',
        id: 'u2',
      },
      {
        email: 'user3@test.com',
        name: 'User 3',
        id: 'u3',
      },
    ],
    fields: [
      {
        name: 'North Field',
        wkt: 'POLYGON ((-84.34150323269021 42.77962447110511, -84.34129044408108 42.77962315868189, -84.34125289315487 42.77938035618669, -84.34148535132407 42.77938298110345, -84.34150323269021 42.77962447110511))',
      },
      {
        name: 'South Field',
        wkt: 'POLYGON ((-84.34150323269021 42.77962447110511, -84.34129044408108 42.77962315868189, -84.34125289315487 42.77938035618669, -84.34148535132407 42.77938298110345, -84.34150323269021 42.77962447110511))',
      },
    ],
  },
};

const methods = {
  async isUrlAvailable() {
    /*
    try {
      const r = await api.post('/farmos/checkurl', {
        url: this.localViewModel.form.instanceName,
      });

      if (r.data && r.data.status) {
        console.log('data', r.data);
        if (r.data.status === 'free') {
          this.urlState = 'free';
        } else if (r.data.status === 'taken') {
          this.urlState = 'taken';
        } else {
          this.urlState = null;
          console.log('error', r.data); // TODO show error dialog
        }
      } else {
        throw new Error('Invalid Response Format');
      }
    } catch (error) {
      console.log('error', error);
    }
    this.checkingUrl = false;
    this.$refs.form.validate();
    */
  },
  async loadMembers() {
    /*
    this.invite = false;
    this.activeUsers = [];

    try {
      console.log('farmos instance', this.localViewModel.form);
      const { data } = await api.get(`/groups/${this.selectedGroup}?populate=true`);
      this.entity = { ...this.entity, ...data };

      const { data: members } = await api.get(`/memberships?group=${this.selectedGroup}&populate=true`);
      this.members = members.map((m) => m.email);
    } catch (e) {
      console.log('error', e);
      this.$emit('dialog', 'Error', e.message);
    }
    */
  },
};
