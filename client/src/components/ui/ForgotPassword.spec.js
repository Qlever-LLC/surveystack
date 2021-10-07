// yarn client:test -- -- client/src/components/ui/ForgotPassword.spec.js

import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import ForgotPassword from './ForgotPassword.vue';
import { RouterLinkStub } from '@vue/test-utils';
import mockAxios from 'axios';

describe('ForgotPassword component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to ForgotPassword by default', async () => {
      const { getByRole } = renderWithVuetify(ForgotPassword, {
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
      getByRole('link', { name: 'Sign in' });
    });
    it('Renders button to ForgotPassword when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(ForgotPassword, {
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
      getByRole('button', { name: 'Sign in' });
    });
  });

  describe('submitting form', () => {
    it('shows an error when email is empty', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(ForgotPassword, {
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
      const emailInput = getByLabelText('Email');
      fireEvent.update(emailInput, '');
      expect(emailInput.value).toBe('');
      expect(queryByText('Please enter a valid email address')).toBeNull();
      const button = getByText('Submit');
      await fireEvent.click(button);
      getByText('Please enter a valid email address');
    });
  });

  describe('mock axios', () => {
    const emailData = 'email@mail.com';
    const TransitionStub = {
      render(h) {
        return h('transition-stub', this.$slots.default);
      },
    };
    it('displays success message when submit is called with a non empty email', async () => {
      mockAxios.post.mockImplementation(() => Promise.resolve());
      const { getByLabelText, getByText } = renderWithVuetify(ForgotPassword, {
        propsData: {},
        store: {},
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
      const emailInput = getByLabelText('Email');
      fireEvent.update(emailInput, emailData);
      expect(emailInput.value).toBe(emailData);
      const button = getByText('Submit');
      await fireEvent.click(button);
      getByText(`Check your inbox on ${emailData}`);
    });
    it('displays error message status 404 when submit is called with a "wrong" email', async () => {
      let error404 = { response: { status: 404 } };
      mockAxios.post.mockImplementation(() => Promise.reject(error404));
      const { getByLabelText, getByText } = renderWithVuetify(ForgotPassword, {
        propsData: {},
        store: {},
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
      const emailInput = getByLabelText('Email');
      fireEvent.update(emailInput, 'such_a_email_that_returns_status_404');
      expect(emailInput.value).toBe('such_a_email_that_returns_status_404');
      const button = getByText('Submit');
      await fireEvent.click(button);
      getByText(`invalid email`);
    });
    it('displays error message status default when submit is called with a "wrong" email', async () => {
      let error500 = { response: { status: 500 } };
      mockAxios.post.mockImplementation(() => Promise.reject(error500));
      const { getByLabelText, getByText } = renderWithVuetify(ForgotPassword, {
        propsData: {},
        store: {},
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
      const emailInput = getByLabelText('Email');
      fireEvent.update(emailInput, 'such_a_email_that_returns_status_default');
      expect(emailInput.value).toBe('such_a_email_that_returns_status_default');
      const button = getByText('Submit');
      await fireEvent.click(button);
      getByText(`Unknown error :/`);
    });
  });
});
