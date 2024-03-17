import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import Register from './Register.vue';
import mockAxios from 'axios';
import { autoSelectActiveGroup } from '@/utils/memberships';
import { flushPromises } from '@vue/test-utils';

jest.mock('@/utils/memberships');

describe('Register component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to Register by default', async () => {
      const { getByRole } = renderWithVuetify(Register);
      getByRole('link', { name: 'Already have an account?' });
    });

    it('Renders button to Register when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(Register, {
        props: { useLink: false },
      });
      getByRole('button', { name: 'Already have an account?' });
    });
  });

  describe('submitting form and check submit() method behaviour based on user fields', () => {
    it('shows an error when password is passed without email', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Register);
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'somePassword');
      expect(passwordInput.value).toBe('somePassword');
      expect(queryByText('Email must not be empty.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      getByText('Email must not be empty.');
    });

    it('shows an error when email is passed without password', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(Register);
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email.error@error.com');
      expect(emailInput.value).toBe('email.error@error.com');
      expect(queryByText('Password must not be empty.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      getByText('Password must not be empty.');
    });
  });

  describe('submit form and check submit() method behaviour based on try to auto join group if this is a whitelabel', () => {
    it('submit and trying autojoin if this.isWhitelabel', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() => Promise.resolve({ data: 'dummy data' }));
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Register, {
        global: {
          mocks: {
            $store: {
              getters: {
                'whitelabel/isWhitelabel': true,
                'whitelabel/partner': {
                  id: 1,
                },
              },
              dispatch: jest.fn(),
            },
            $route: {
              params: { redirect: false },
              query: {},
            },
            $router: { push },
          },
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await flushPromises();

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(autoSelectActiveGroup).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith('/');
    });

    it('submit and trying autojoin if this.isWhitelabel && this.registrationEnabled BUT post throw an error', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() =>
        Promise.reject({
          response: { data: { message: 'an error message' } },
        })
      );
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Register, {
        global: {
          mocks: {
            $store: {
              getters: {
                'whitelabel/isWhitelabel': true,
                'whitelabel/partner': {
                  id: 1,
                },
              },
              dispatch: jest.fn(),
            },
            $route: {
              params: { redirect: false },
              query: {},
            },
            $router: { push },
          },
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(autoSelectActiveGroup).toHaveBeenCalledTimes(0);
      expect(push).toHaveBeenCalledWith('/');
    });
  });

  describe('submit form and check submit() method behaviour based on redirection', () => {
    it("submit and get the redirection 'this.$route.params.redirect = true' ", async () => {
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Register, {
        global: {
          mocks: {
            $store: {
              getters: {
                'whitelabel/isWhitelabel': false,
              },
              dispatch: jest.fn(),
            },
            $route: {
              params: { redirect: true },
              query: {},
            },
            $router: { push },
          },
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);

      expect(push).toHaveBeenCalledWith(true);
    });

    it("submit and get the redirection '/' ", async () => {
      const push = jest.fn();
      const { getByLabelText, getByText } = renderWithVuetify(Register, {
        global: {
          mocks: {
            $store: {
              getters: {
                'whitelabel/isWhitelabel': false,
              },
              dispatch: jest.fn(),
            },
            $route: {
              params: { redirect: false },
              query: {},
            },
            $router: { push },
          },
        },
      });
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);

      expect(push).toHaveBeenCalledWith('/');
    });
  });

  describe('submit form and check submit() method behaviour based on throw error', () => {
    it('displays an error when status 409', async () => {
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        global: {
          mocks: {
            $store: {
              getters: {
                'whitelabel/isWhitelabel': false,
              },
              dispatch: action => {
                if (action === 'auth/login') {
                  return Promise.reject({
                    response: { status: 409, data: { message: 'error message' } },
                  });
                }
              },
            },
          },
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
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        global: {
          mocks: {
            $store: {
              getters: {
                'whitelabel/isWhitelabel': false,
              },
              dispatch: action => {
                if (action === 'auth/login') {
                  return Promise.reject({
                    response: { status: 400, data: { message: 'error message' } },
                  });
                }
              },
            },
          },
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

    it('displays an error when an error occurred and status is different to 409 and 400 (ex: status 500)', async () => {
      const { getByLabelText, getByText, findByText } = renderWithVuetify(Register, {
        global: {
          mocks: {
            $store: {
              getters: {
                'whitelabel/isWhitelabel': false,
              },
              dispatch: action => {
                if (action === 'auth/login') {
                  return Promise.reject({
                    response: { status: 500, data: { message: 'Unknown error :/' } },
                  });
                }
              },
            },
          },
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
