import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import Register from './Register.vue';
import mockAxios from 'axios';
import { flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createStoreObject } from '@/store';
import { createAppRouter } from '@/router';

const renderRegister = ({ props } = {}, store, router) =>
  renderWithVuetify(Register, { props: { ...props } }, store, router);

describe('Register component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to Register by default', async () => {
      const { getByRole } = renderRegister();
      getByRole('link', { name: 'Already have an account?' });
    });

    it('Renders button to Register when useLink is false', async () => {
      const { getByRole } = renderRegister({ props: { useLink: false } });
      getByRole('button', { name: 'Already have an account?' });
    });
  });

  describe('submitting form and check submit() method behaviour based on user fields', () => {
    it('shows an error when password is passed without email', async () => {
      const { getByLabelText, getByText, queryByText } = renderRegister();
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'somePassword');
      expect(passwordInput.value).toBe('somePassword');
      expect(queryByText('Email must not be empty.')).toBeNull();
      const button = getByText('Sign up');
      await fireEvent.click(button);
      getByText('Email must not be empty.');
    });

    it('shows an error when email is passed without password', async () => {
      const { getByLabelText, getByText, queryByText } = renderRegister();
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
    const WHITELABEL_GROUP_ID = 42;
    it('submit and trying autojoin if this.isWhitelabel', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() => Promise.resolve({ data: 'dummy data' }));
      const store = createStore(createStoreObject());
      const dispatchMock = jest.fn((action) => {
        if (action === 'memberships/getUserMemberships') {
          return Promise.resolve([
            {
              group: {
                _id: WHITELABEL_GROUP_ID,
              },
            },
          ]);
        }
      });
      store.dispatch = dispatchMock;
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      store.getters = {
        'whitelabel/isWhitelabel': true,
        'whitelabel/partner': {
          id: WHITELABEL_GROUP_ID,
        },
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };
      const { getByLabelText, getByText } = renderRegister({}, store, router);
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await flushPromises();

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(router.push).toHaveBeenCalledWith(`/groups/${WHITELABEL_GROUP_ID}`);
    });

    it('submit if this.isWhitelabel, but autojoin throws an error', async () => {
      let res = { data: { meta: { invitationOnly: false } } };
      mockAxios.get.mockImplementation(() => Promise.resolve(res));
      mockAxios.post.mockImplementation(() =>
        Promise.reject({
          response: { data: { message: 'an error message' } },
        })
      );
      const store = createStore(createStoreObject());
      const dispatchMock = jest.fn((action) => {
        if (action === 'memberships/getUserMemberships') {
          return Promise.resolve([]);
        }
      });
      store.dispatch = dispatchMock;
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      store.getters = {
        'whitelabel/isWhitelabel': true,
        'whitelabel/partner': {
          id: WHITELABEL_GROUP_ID,
        },
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };
      const { getByLabelText, getByText } = renderRegister({}, store, router);
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await flushPromises();

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(router.push).toHaveBeenCalledWith('/'); //if user could not join the whitelabel group, route to /
    });
  });

  describe('submit form and check submit() method behaviour based on redirection', () => {
    let res = { data: { meta: { invitationOnly: false } } };
    mockAxios.get.mockImplementation(() => Promise.resolve(res));
    mockAxios.post.mockImplementation(() => Promise.resolve({ data: 'dummy data' }));
    const mockDispatchFn = jest.fn((action) => {
      if (action === 'memberships/getUserMemberships') {
        return Promise.resolve([
          {
            group: {
              _id: 2,
            },
          },
        ]);
      }
    });

    it("submit and get the redirection 'this.$route.params.redirect = 'true'' ", async () => {
      const store = createStore(createStoreObject());
      store.dispatch = mockDispatchFn;
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      store.getters = {
        'whitelabel/isWhitelabel': false,
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };
      const { getByLabelText, getByText } = renderRegister({ props: { redirect: true } }, store, router);
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await flushPromises();

      expect(router.push).toHaveBeenCalledWith(true);
    });

    it("submit and get the redirection '/groups/2' ", async () => {
      const store = createStore(createStoreObject());
      store.dispatch = mockDispatchFn;
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      store.getters = {
        'whitelabel/isWhitelabel': false,
        'auth/user': {
          _id: 2,
        },
        'auth/isLoggedIn': true,
      };
      const { getByLabelText, getByText } = renderRegister({ props: { redirect: false } }, store, router);
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await flushPromises();

      expect(router.push).toHaveBeenCalledWith('/groups/2');
    });
  });

  describe('submit form and check submit() method behaviour based on throw error', () => {
    it('displays an error when status 409', async () => {
      const mockDispatchFn = jest.fn((action) => {
        if (action === 'auth/login') {
          return Promise.reject({
            response: { status: 409, data: { message: 'error message' } },
          });
        }
      });
      const store = createStore(createStoreObject());
      store.dispatch = mockDispatchFn;
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      store.getters = {
        'whitelabel/isWhitelabel': false,
      };
      const { getByLabelText, getByText, findByText } = renderRegister({ props: { redirect: false } }, store, router);
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await findByText('error message');
    });

    it('displays an error when status 400', async () => {
      const mockDispatchFn = jest.fn((action) => {
        if (action === 'auth/login') {
          return Promise.reject({
            response: { status: 400, data: { message: 'error message' } },
          });
        }
      });
      const store = createStore(createStoreObject());
      store.dispatch = mockDispatchFn;
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      store.getters = {
        'whitelabel/isWhitelabel': false,
      };
      const { getByLabelText, getByText, findByText } = renderRegister({ props: { redirect: false } }, store, router);
      const emailInput = getByLabelText('E-Mail');
      fireEvent.update(emailInput, 'email@mail.com');
      const passwordInput = getByLabelText('Password');
      fireEvent.update(passwordInput, 'samePassword');

      const button = getByText('Sign up');
      await fireEvent.click(button);
      await findByText('error message');
    });

    it('displays an error when an error occurred and status is different to 409 and 400 (ex: status 500)', async () => {
      const mockDispatchFn = jest.fn((action) => {
        if (action === 'auth/login') {
          return Promise.reject({
            response: { status: 500, data: { message: 'Unknown error :/' } },
          });
        }
      });
      const store = createStore(createStoreObject());
      store.dispatch = mockDispatchFn;
      const router = createAppRouter();
      jest.spyOn(router, 'push');
      store.getters = {
        'whitelabel/isWhitelabel': false,
      };
      const { getByLabelText, getByText, findByText } = renderRegister({ props: { redirect: false } }, store, router);
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
