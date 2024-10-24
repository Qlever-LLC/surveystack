export const GROUP_PATH_DELIMITER = '/';
export const SPEC_VERSION_SURVEY = 10;
export const SPEC_VERSION_SUBMISSION = 4;
export const SPEC_VERSION_SCRIPT = 2;
export const SPEC_VERSION_GROUP = 2;
export const ASELECT_MAX_ITEMS_TOBE_VSELECT = 15;
export const ARCHIVE_REASONS = ['TEST_DATA', 'INCORRECT_DATA', 'EQUIPMENT_ERROR', 'USER_ERROR', 'RESUBMIT', 'OTHER'];
export const DEFAULT_SCRIPT = `
/**
 * Process
 * @param {props} props
 * @param {submission} props.submission
 * @param {state} state
 */
export async function process(props, state) {
  const { submission, parent, control, params } = props;
  const { value, context } = state;

  // do stuff
  // ...

  return {
    context,
    value: null,
    status: {
      type: statusTypes.SUCCESS,
      message: 'script successfully executed at ' + new Date().toISOString(true),
    },
  }
}

/**
 * render
 * @param {props} props
 * @param {state} state
 * @param {setState} setState
 */
export function render(props, state, setState) {
  const { submission, parent, control, params } = props;
  const { value, context } = state;
  const ui = createUI();

  ui.add(
      ui.text('Basic text'),
      ui.markdown(\`# Markdown Headline
-------
*italics*
**bold**
***bold italics***
~~strikethrough~~
[link]()
> Quote
- Unordered List
- List Item

1. Ordered List
2. List Item
    \`),

    ui.card('my card content', {
        header: 'Card',
        meta: 'meta',
        footer: 'footer',
    }),
    ui.message('Error', { type: 'error', header: 'Error' }),
    ui.message('Warning', { type: 'warning', header: 'Warning' }),
    ui.message('Plain', { header: 'Plain' }),
    ui.message('Plain'),
    ui.message('Info', { type: 'info', header: 'Info' }),
    ui.message('Success', { type: 'success', header: 'Success' }),
  );

  return ui.node;
};
        `;
