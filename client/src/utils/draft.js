import { linearControlsWithGroups } from '@/utils/submissions';

export const getApiComposeErrors = (survey, submission) => {
  const errors = [];
  linearControlsWithGroups(survey, submission).forEach((control) => {
    console.log('walking through', control);
    if (control.meta && control.meta.apiCompose) {
      if (Array.isArray(control.meta.apiCompose)) {
        for (const apc of control.meta.apiCompose) {
          const errorsArray = apc.errors;
          if (errorsArray && Array.isArray(errorsArray)) {
            errors.push(
              ...errorsArray.map((str) => ({
                body: str,
                title: control.breadcrumbs.join('.'),
                error: true,
              }))
            );
          }
        }
      } else {
        const errorsArray = control.meta.apiCompose.errors;
        if (errorsArray && Array.isArray(errorsArray)) {
          errors.push(
            ...errorsArray.map((str) => ({
              body: str,
              title: control.breadcrumbs.join('.'),
              error: true,
            }))
          );
        }
      }
    }
  });

  return errors;
};
