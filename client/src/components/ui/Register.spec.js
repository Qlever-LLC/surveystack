import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import Register from './Register.vue';
import { RouterLinkStub } from '@vue/test-utils';
import mockAxios from 'axios';
import { autoSelectActiveGroup } from '@/utils/memberships';

const noRoutes = [];
jest.mock('@/utils/memberships');

const TransitionStub = {
  render(h) {
    return h('transition-stub', this.$slots.default);
  },
};

describe('Register component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to Register by default', async () => {
      const { getByRole } = renderWithVuetify(Register, {
        routes: noRoutes,
        store: {},
        propsData: {},
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      getByRole('link', { name: 'Already have an account?' });
    });
    it('Renders button to Register when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(Register, {
        routes: noRoutes,
        store: {},
        propsData: { useLink: false },
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      getByRole('button', { name: 'Already have an account?' });
    });
  });

  describe('submitting form and check submit() method behaviour based on user fields', () => {
    it('shows an error when password is passed without email', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Register, {
        routes: noRoutes,
        propsData: {},
        store: {},
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'somePassword');
      expect(passwordInput.value).toBe('somePassword');
      expect(queryByText('Email must not be empty.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      getByText('Email must not be empty.');
    });

    it('shows an error when email is passed without password', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Register, {
        routes: noRoutes,
        propsData: {},
        store: {},
        stubs: {
          RouterLink: RouterLinkStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');
      expect(queryByText('Password must not be empty.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      getByText('Password must not be empty.');
    });
  });

  // TODO solve error mocks can't be used with VueRouter on localVue https://v1.test-utils.vuejs.org/guides/#using-with-vue-router
  // describe('submit form and check submit() method behaviour based on try to auto join group if this is a whitelabel', () => {
  //   it('submit and trying autojoin if this.isWhitelabel', async () => {
  //     let res = { data: { meta: { invitationOnly: false } } };
  //     mockAxios.get.mockImplementation(() => Promise.resolve(res));
  //     mockAxios.post.mockImplementation(() => Promise.resolve({ data: 'dummy data' }));
  //     const push = jest.fn();
  //     const { getByLabelText, getByText } = renderWithVuetify(Register, {
  //       store: {
  //         getters: {
  //           'whitelabel/isWhitelabel': () => true,
  //           'whitelabel/partner': () => ({
  //             id: 1,
  //           }),
  //         },
  //         actions: {
  //           'auth/login': jest.fn(() => Promise.resolve()),
  //           'surveys/fetchPinned': jest.fn(),
  //         },
  //       },
  //       mocks: {
  //         $route: {
  //           params: { redirect: false },
  //           query: {},
  //         },
  //         $router: {
  //           push,
  //         },
  //       },
  //       stubs: {
  //         RouterLink: RouterLinkStub,
  //         transition: TransitionStub,
  //       },
  //     });
  //     const emailInput = getByLabelText('E-Mail');
  //     fireEvent.update(emailInput, 'email@mail.com');
  //     const passwordInput = getByLabelText('Password');
  //     fireEvent.update(passwordInput, 'samePassword');

  //     const button = getByText('Sign up');
  //     await fireEvent.click(button);
  //     // wait for Promise for pending result
  //     await new Promise((resolve) => setTimeout(resolve, 0));
  //     expect(mockAxios.post).toHaveBeenCalledTimes(1);
  //     expect(autoSelectActiveGroup).toHaveBeenCalledTimes(1);
  //     expect(push).toHaveBeenCalledWith('/');
  //   });

  //   it('submit and trying autojoin if this.isWhitelabel && this.registrationEnabled BUT post throw an error', async () => {
  //     let res = { data: { meta: { invitationOnly: false } } };
  //     mockAxios.get.mockImplementation(() => Promise.resolve(res));
  //     mockAxios.post.mockImplementation(() =>
  //       Promise.reject({
  //         response: { data: { message: 'an error message' } },
  //       })
  //     );
  //     const push = jest.fn();
  //     const { getByLabelText, getByText } = renderWithVuetify(Register, {
  //       store: {
  //         getters: {
  //           'whitelabel/isWhitelabel': () => true,
  //           'whitelabel/partner': () => ({
  //             id: 1,
  //           }),
  //         },
  //         actions: {
  //           'auth/login': jest.fn(() => Promise.resolve()),
  //           'surveys/fetchPinned': jest.fn(),
  //         },
  //       },
  //       mocks: {
  //         $route: {
  //           params: { redirect: false },
  //           query: {},
  //         },
  //         $router: {
  //           push,
  //         },
  //       },
  //       stubs: {
  //         RouterLink: RouterLinkStub,
  //         transition: TransitionStub,
  //       },
  //     });
  //     const emailInput = getByLabelText('E-Mail');
  //     fireEvent.update(emailInput, 'email@mail.com');
  //     const passwordInput = getByLabelText('Password');
  //     fireEvent.update(passwordInput, 'samePassword');

  //     const button = getByText('Sign up');
  //     await fireEvent.click(button);
  //     // wait for Promise for pending result
  //     await new Promise((resolve) => setTimeout(resolve, 0));
  //     expect(mockAxios.post).toHaveBeenCalledTimes(1);
  //     expect(autoSelectActiveGroup).toHaveBeenCalledTimes(0);
  //     expect(push).toHaveBeenCalledWith('/');
  //   });
  // });

  // describe('submit form and check submit() method behaviour based on redirection', () => {
  //   it("submit and get the redirection 'this.$route.params.redirect = true' ", async () => {
  //     const push = jest.fn();
  //     const { getByLabelText, getByText } = renderWithVuetify(Register, {
  //       store: {
  //         getters: {
  //           'whitelabel/isWhitelabel': () => false,
  //         },
  //         actions: {
  //           'auth/login': jest.fn(() => Promise.resolve()),
  //           'surveys/fetchPinned': jest.fn(),
  //         },
  //       },
  //       mocks: {
  //         $route: {
  //           params: { redirect: true },
  //           query: {},
  //         },
  //         $router: {
  //           push,
  //         },
  //       },
  //       stubs: {
  //         RouterLink: RouterLinkStub,
  //         transition: TransitionStub,
  //       },
  //     });
  //     const emailInput = getByLabelText('E-Mail');
  //     fireEvent.update(emailInput, 'email@mail.com');
  //     const passwordInput = getByLabelText('Password');
  //     fireEvent.update(passwordInput, 'samePassword');

  //     const button = getByText('Sign up');
  //     await fireEvent.click(button);
  //     // wait for Promise for pending result
  //     await new Promise((resolve) => setTimeout(resolve, 0));
  //     expect(push).toHaveBeenCalledWith(true);
  //   });

  //   it("submit and get the redirection '/' ", async () => {
  //     const push = jest.fn();
  //     const { getByLabelText, getByText } = renderWithVuetify(Register, {
  //       store: {
  //         getters: {
  //           'whitelabel/isWhitelabel': () => false,
  //         },
  //         actions: {
  //           'auth/login': jest.fn(() => Promise.resolve()),
  //           'surveys/fetchPinned': jest.fn(),
  //         },
  //       },
  //       mocks: {
  //         $route: {
  //           params: { redirect: false },
  //           query: {},
  //         },
  //         $router: {
  //           push,
  //         },
  //       },
  //       stubs: {
  //         RouterLink: RouterLinkStub,
  //         transition: TransitionStub,
  //       },
  //     });
  //     const emailInput = getByLabelText('E-Mail');
  //     fireEvent.update(emailInput, 'email@mail.com');
  //     const passwordInput = getByLabelText('Password');
  //     fireEvent.update(passwordInput, 'samePassword');

  //     const button = getByText('Sign up');
  //     await fireEvent.click(button);
  //     // wait for Promise for pending result
  //     await new Promise((resolve) => setTimeout(resolve, 0));
  //     expect(push).toHaveBeenCalledWith('/');
  //   });
  // });

  describe('submit form and check submit() method behaviour based on throw error', () => {
    it('displays an error when status 409', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        response: { status: 409, data: { message: 'error message' } },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        routes: noRoutes,
        store: {
          actions: {
            'auth/login': authLoginMock,
          },
        },
        propsData: {},
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await findByText('error message');
    });

    it('displays an error when status 400', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        response: { status: 400, data: { message: 'error message' } },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        routes: noRoutes,
        store: {
          actions: {
            'auth/login': authLoginMock,
          },
        },
        propsData: {},
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await findByText('error message');
    });

    it('displays an error when an error occured and status is different to 409 and 400 (ex: status 500)', async () => {
      const authLoginMock = jest.fn();
      authLoginMock.mockRejectedValue({
        response: { status: 500, data: { message: 'Unknown error :/' } },
      });
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        routes: noRoutes,
        store: {
          actions: {
            'auth/login': authLoginMock,
          },
        },
        propsData: {},
        stubs: {
          RouterLink: RouterLinkStub,
          transition: TransitionStub,
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await findByText('Unknown error :/');
    });
  });
});
