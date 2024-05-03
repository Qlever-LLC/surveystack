import { fireEvent } from '@testing-library/vue';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import ForgotPassword from './ForgotPassword.vue';
import mockAxios from 'axios';

describe('ForgotPassword component', () => {
  describe('navigation links and buttons', () => {
    it('Renders link to ForgotPassword by default', async () => {
      const { getByRole } = renderWithVuetify(ForgotPassword, {
        props: {},
      });
      getByRole('link', { name: 'Back to login' });
    });

    it('Renders button to ForgotPassword when useLink is false', async () => {
      const { getByRole } = renderWithVuetify(ForgotPassword, {
        props: { useLink: false },
      });
      getByRole('button', { name: 'Back to login' });
    });
  });

  describe('submitting form', () => {
    it('shows an error when email is empty', async () => {
      const { getByLabelText, getByText, queryByText } = renderWithVuetify(ForgotPassword, {
        props: {},
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
    it('displays success message when submit is called with a non empty email', async () => {
      const emailData = 'email@mail.com';
      mockAxios.post.mockImplementation(() => Promise.resolve());
      const { getByLabelText, getByText } = renderWithVuetify(ForgotPassword, {
        props: {},
      });
      const emailInput = getByLabelText('Email');
      fireEvent.update(emailInput, emailData);
      expect(emailInput.value).toBe(emailData);
      const button = getByText('Submit');
      await fireEvent.click(button);
      getByText(
        'If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.'
      );
    });

    it('displays error message when submit returns with an error', async () => {
      let error500 = { response: { status: 500 } };
      mockAxios.post.mockImplementation(() => Promise.reject(error500));
      const { getByLabelText, getByText } = renderWithVuetify(ForgotPassword, {
        props: {},
      });
      const emailInput = getByLabelText('Email');
      fireEvent.update(emailInput, 'such_a_email_that_returns_status_default');
      expect(emailInput.value).toBe('such_a_email_that_returns_status_default');
      const button = getByText('Submit');
      await fireEvent.click(button);
      getByText('An error occurred, please try again later.');
    });
  });
});
