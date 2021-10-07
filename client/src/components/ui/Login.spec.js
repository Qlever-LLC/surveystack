// yarn client:test -- -- client/src/components/ui/Login.spec.js

import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import Login from './Login.vue';
import { RouterLinkStub } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import mockAxios from 'axios';

const TransitionStub = {
  render(h) {
    return h('transition-stub', this.$slots.default);
  },
};

describe('Login component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to Register by default', async () => {
      const { getByRole } = renderWithVuetify(Login, {
        store: {},
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      getByRole('link', { name: 'Register now' });
    });
    it('Renders button to Register when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(Login, {
        store: {},
        propsData: { useLink: false },
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      getByRole('button', { name: 'Register now' });
    });

    it('Renders link to Forgot Password by default', async () => {
      const { getByRole } = renderWithVuetify(Login, {
        store: {},
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      getByRole('link', { name: 'Forgot password?' });
    });
    it('Renders button to Forgot Password when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(Login, {
        store: {},
        propsData: { useLink: false },
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      getByRole('button', { name: 'Forgot password?' });
    });
  });

  describe('submitting form', () => {
    it('shows an error when email is passed without password', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Login, {
        propsData: {},
        store: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');
      expect(queryByText('Password must not be empty.')).toBeNull();
      const button = getByText('Login');
      await fireEvent.click(button);
      getByText('Password must not be empty.');
    });

    it('shows an error when password is passed without email', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Login, {
        propsData: {},
        store: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'somePassword');
      expect(passwordInput.value).toBe('somePassword');
      expect(queryByText('E-Mail must not be empty.')).toBeNull();
      const button = getByText('Login');
      await fireEvent.click(button);
      getByText('E-Mail must not be empty.');
    });

    /*it("try to submit and get the redirection '/'", async () => {
      const mockF = jest.fn(() => Promise.resolve());
      mockAxios.post.mockImplementation(() => Promise.resolve({ data: 'dummy_data' }));
      const wrapper = mount(Login, {
        data() {
          return {
            registrationEnabled: true,
          };
        },
        computed: {
          passwordInputType() {
            return '';
          },
          registerLink() {
            return '';
          },
          isWhitelabel() {
            return true;
          },
          whitelabelPartner() {
            return { id: 1 };
          },
          hasInvitation() {
            return false;
          },
        },
        methods: {},
        store: {
          getters: {
            'auth/user': {
              _id: 'value_1',
            },
          },
          actions: {
            'memberships/getUserMemberships': mockF,
            'memberships/setActiveGroup': mockF,

            'auth/login': mockF,
            'surveys/fetchPinned': mockF,
          },
        },
        mocks: {
          $route: {
            query: { code: 123 },
            params: { redirect: false },
          },
          //$router : { push: jest.fn(), },
          $store: {
            dispatch: () => {
              dummyData: 'dummyData';
            },
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      const routerPushSpy = jest.spyOn(wrapper.vm.$router, 'push');
      //wrapper.vm.autoSelectActiveGroup = jest.fn(() => console.log('autoSelectActiveGroup simulated'));;

      wrapper.setData({ entity: { email: 'email' } });
      wrapper.setData({ entity: { password: 'password' } });
      const button = wrapper.find('button.text-capitalize');
      await button.trigger('click');
      //expect(wrapper.vm.autoSelectActiveGroup).toHaveBeenCalled();
      //check route that is pushed
      expect(routerPushSpy).toHaveBeenCalledTimes(1);
      //expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/');
      console.log('the $route ', wrapper.vm.$route);
      console.log('the $router ', wrapper.vm.$router);
    });*/

    it('displays an error when incorrect password is submitted (status 401)', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        message: 'Invalid email or password',
        response: { status: 401 },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Login, {
        store: {
          actions: {
            'auth/login': authLoginMock,
            'surveys/fetchPinned': jest.fn(),
          },
        },
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'someValidMail@mail.com');
      //expect(emailInput.value).toBe('someValidMail@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'wrongPassword');
      //expect(pwdInput.value).toBe('wrongPassword');

      const button = getByText('Login');
      await fireEvent.click(button);
      await findByText('Invalid email or password');
    });
    it('displays an error when incorrect email is submitted (status 404)', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        message: 'Invalid email or password',
        response: { status: 404 },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Login, {
        store: {
          actions: {
            'auth/login': authLoginMock,
            'surveys/fetchPinned': jest.fn(),
          },
        },
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'password');
      expect(pwdInput.value).toBe('password');

      const button = getByText('Login');
      await fireEvent.click(button);
      await findByText('Invalid email or password');
    });
    it('displays an error when an error occured on the login, that is different to 401 and 404 (ex: status 500)', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        message: 'An error occured',
        response: { status: 500 },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Login, {
        store: {
          actions: {
            'auth/login': authLoginMock,
            'surveys/fetchPinned': jest.fn(),
          },
        },
        propsData: {},
        mocks: {
          $route: {
            query: {},
          },
        },
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      expect(emailInput.value).toBe('email@mail.com');

      const pwdInput = getByLabelText('Password');
      fireEvent.update(pwdInput, 'password');
      expect(pwdInput.value).toBe('password');

      const button = getByText('Login');
      await fireEvent.click(button);
      await findByText('An error occured');
    });
  });
});
