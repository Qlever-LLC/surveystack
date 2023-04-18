/* eslint-disable brace-style */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfMake from 'html-to-pdfmake';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import dateFnsFormat from 'date-fns/format';
import axios from 'axios';
import getProperty from 'lodash/get';
import { fetchSubmissionUniqueItems } from './submissions';
import { getPublicDownloadUrl } from './resources';
import { getGroupNameById } from './groups';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const fontSizes = {
  xxl: 24,
  xl: 20,
  lg: 18,
  md: 16,
  sm: 14,
  xs: 12,
  xxs: 8,
};

const colors = {
  black: 'black',
  white: 'white',
  lightGray: '#e5e7eb',
  gray: '#9ca3af',
  darkGray: '#374151',
  blue: '#1e3a8a',
  lightBlue: '#60a5fa',
  code: '#f5f5f5',
  table: {
    headerColor: '#d1d5db',
    evenColor: '#f3f4f6',
    oddColor: 'white',
  },
};

const margins = {
  xl: [0, 0, 0, 48],
  lg: [0, 0, 0, 24],
  md: [0, 0, 0, 16],
  sm: [0, 0, 0, 12],
  xs: [0, 0, 0, 8],
  answer: [12, 0, 0, 0],
  zero: [0, 0, 0, 0],
};

const lines = {
  dash: { dash: { length: 3, space: 3 } },
};

const styles = {
  header: {
    fontSize: fontSizes.xxl,
    bold: true,
    alignment: 'center',
    margin: margins.sm,
  },
  meta: {
    fontSize: fontSizes.xxs,
    color: colors.gray,
    margin: margins.md,
  },
  section: {
    fontSize: fontSizes.xl,
    bold: true,
  },
  label: {
    bold: true,
    margin: margins.xs,
  },
  hint: {
    color: colors.darkGray,
    margin: margins.xs,
    italic: true,
  },
  moreInfo: {
    color: colors.gray,
    italics: true,
    margin: margins.xs,
  },
  answer: {
    color: colors.blue,
    margin: margins.answer,
  },
  answerEmpty: {
    background: colors.lightGray,
    color: colors.black,
    margin: margins.answer,
  },
  link: {
    color: colors.blue,
    decoration: 'underline',
  },
  code: {
    fontSize: fontSizes.xxs,
    color: colors.black,
    margin: [8, 2, 8, 2],
  },
};

const defaultStyle = {
  fontSize: fontSizes.xs,
  color: colors.black,
};

const SVG = {
  'check-true': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17.99 9L16.58 7.58L9.99 14.17L7.41 11.6L5.99 13.01L9.99 17L17.99 9Z" fill="${colors.blue}"/></g></svg>`,
  'check-false': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="${colors.blue}"/></g></svg>`,
  'radio-true': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="${colors.blue}"/><path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="${colors.blue}"/></g></svg>`,
  'radio-false': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="${colors.blue}"/></g></svg>`,
};

const LVL = {
  section: 1,
  block: 2,
};

function getControlSvg(multiple, checked) {
  return SVG[`${multiple ? 'check' : 'radio'}-${Boolean(checked)}`];
}

function formatDate(date, format = 'MMM d, yyyy h:mm a') {
  const parsedDate = parseISO(date);
  return isValid(parsedDate) && parsedDate.toISOString() === date ? dateFnsFormat(parsedDate, format) : date;
}

function transformValueToLabel(value, source) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => transformValueToLabel(item, source));
  }

  const match = source.find((option) => option.value === value);
  return match ? match.label : value;
}

function toArray(value) {
  return Array.isArray(value) ? value : value || value === 0 ? [value] : [];
}

async function getResource(resources, source) {
  if (!Array.isArray(resources)) {
    return [];
  }

  const resource = resources.find((resource) => resource.id === source);
  if (!resource) {
    return [];
  }

  if (resource.location === 'EMBEDDED') {
    return resource.content;
  }

  if (resource.location === 'REMOTE') {
    try {
      return await fetchSubmissionUniqueItems(resource.content.id, resource.content.path);
    } catch {
      return [];
    }
  }

  return [];
}

class PdfGenerator {
  constructor({ survey, submission, options }) {
    this.initialize();
    this.survey = survey;
    this.submission = submission;
    this.options = {
      printable: false,
      ...options,
    };
  }

  initialize() {
    this.metaIndex = 0;
    this.resourcesMap = {};
    this.docDefinition = {
      content: [],
      styles,
      defaultStyle,
      pageBreakBefore: this.pageBreakBefore.bind(this),
    };
  }

  async download() {
    const pdf = await this.pdf();
    if (!pdf) {
      return null;
    }
    pdf.download(this.filename() + '.pdf');
  }

  async pdf() {
    if (!this.survey || (!this.options.printable && !this.submission)) {
      return null;
    }

    this.initialize();
    this.generateInfo();
    await this.generateMeta();

    const revision = this.options.printable
      ? this.survey.revisions.find((revision) => revision.version === this.survey.latestVersion)
      : this.survey.revisions.find((revision) => revision.version === this.submission.meta.survey.version);

    if (revision && Array.isArray(revision.controls)) {
      const validControls = this.getValidControls(revision.controls);

      for (let index = 0; index < validControls.length; index += 1) {
        const control = validControls[index];
        await this.generateControl({
          ...control,
          index: [index + 1],
        });
      }
    }

    return pdfMake.createPdf(this.docDefinition);
  }

  filename() {
    if (!this.submission) {
      return `${this.survey.name} - SurveyStack`;
    }

    const { dateSubmitted, dateModified, dateCreated } = this.submission.meta;
    const date = dateSubmitted || dateModified || dateCreated || new Date().toISOString();

    return `${this.survey.name}-${this.submission._id.toString().slice(-6)}-${formatDate(date, 'yyyy-MM-dd-hh-mm-ss')}`;
  }

  /*******************************************************************/
  /********************     Document meta info     *******************/
  /*******************************************************************/

  generateInfo() {
    this.docDefinition.info = {
      title: this.filename(),
      author: 'Our-Sci SurveyStack Team',
      subject: `Report of the SurveyStack survey`,
      keywords: 'SurveyStack, Survey, FarmOS, OurSci, what else?',
    };
  }

  async generateMeta() {
    const metaBody = [];

    if (this.submission) {
      const { dateSubmitted, dateModified, dateCreated } = this.submission.meta;
      const metaDate = formatDate(dateSubmitted || dateModified || dateCreated || new Date().toISOString());
      const groupName = await getGroupNameById(this.submission.meta.group.id);
      const user = this.submission.meta.submitAsUser || this.submission.meta.creator;

      metaBody.push(
        ['Submitted to', `${groupName} (${this.submission.meta.group.path})`.trim()],
        ['Submitted on', metaDate],
        [
          'Submitted by',
          {
            text: [user.name, { text: ` (${user.email})`, color: colors.lightBlue }],
          },
        ]
      );
    } else {
      metaBody.push(['Generated on', formatDate(new Date().toISOString())]);
    }

    this.docDefinition.content.push(
      {
        text: this.survey.name,
        style: 'header',
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              body: [
                ...metaBody,
                [
                  'Generated by',
                  {
                    text: ['SurveyStack', { text: ' (www.surveystack.io)', color: colors.lightBlue }],
                  },
                ],
              ],
            },
            layout: 'noBorders',
            style: 'meta',
          },
        ],
      }
    );

    this.metaIndex = this.docDefinition.content.length;
    return this.docDefinition.content.length;
  }

  /*******************************************************************/
  /****************     Header/ Footer/ Page break     ***************/
  /*******************************************************************/

  // eslint-disable-next-line no-unused-vars
  pageBreakBefore(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
    if (currentNode.headlineLevel === LVL.section) {
      return followingNodesOnPage.length <= 2 && nodesOnNextPage.length > 2;
    }

    if (currentNode.headlineLevel === LVL.block) {
      return followingNodesOnPage.length <= 1 && nodesOnNextPage.length > 1;
    }

    return false;
  }

  /*******************************************************************/
  /********************     Control generators     *******************/
  /*******************************************************************/

  async generateControl(control, path = []) {
    // Group, Page
    if (this.isContainerControl(control)) {
      this.docDefinition.content.push(this.getSectionDef(control));

      if (!Array.isArray(control.children)) {
        return;
      }

      const validControls = this.getValidControls(control.children);
      for (let index = 0; index < validControls.length; index += 1) {
        const child = validControls[index];
        await this.generateControl(
          {
            ...child,
            index: [...control.index, index + 1],
          },
          [...path, control.name]
        );
      }

      return;
    }

    const { name, label, type, hint, moreInfo, options } = control;

    const layout = this.getControlLayout(control);
    const source = await this.getControlSource(control);

    const len = this.docDefinition.content.length;
    if (this.isRootControl(control)) {
      // Root
      this.docDefinition.content.push(this.getSectionDef(control));
    } else if (label) {
      // label
      this.docDefinition.content.push({
        text: label,
        style: 'label',
        headlineLevel: LVL.block,
      });
    }

    // hint
    if ((type !== 'instructions' || type !== 'instructionsImageSplit') && hint) {
      const labelSet = len !== this.docDefinition.content.length;
      this.docDefinition.content.push({
        text: hint,
        style: labelSet ? 'hint' : 'label',
        headlineLevel: labelSet ? 0 : LVL.block,
      });
    }

    // More info
    if (moreInfo) {
      this.docDefinition.content.push({
        text: moreInfo,
        style: 'moreInfo',
      });
    }

    let def = null;
    /*
     **  Printable version
     */
    if (this.options.printable) {
      // Matrix
      if (type === 'matrix') {
        def = await this.getMatrixTableDef('', options);
      }
      // Selection
      else if (type === 'selectSingle' || type === 'selectMultiple' || type === 'ontology') {
        const multiple = type === 'selectMultiple' || (type === 'ontology' && options.hasMultipleSelections);
        def = this.getSelectDef('', source, layout.columns, multiple);
      }
      // Number
      else if (type === 'number') {
        def = this.getPrintableNumberDef();
      }
      // Date
      else if (type === 'date') {
        def = this.getPrintableDateDef();
      }
      // Other
      else if (!['group', 'page', 'instructions', 'instructionsImageSplit', 'script'].includes(type)) {
        def = this.getPrintableAnswerDef();
      }

      if (def) {
        this.docDefinition.content.push(def);
      }
      this.docDefinition.content.push({ text: '', margin: margins.lg });

      return;
    }

    /*
     **  Normal version
     */

    // Answer
    const answerKey = [...path, name, 'value'];
    if (type === 'location') {
      answerKey.push('geometry', 'coordinates');
    }
    let answer = getProperty(this.submission.data, answerKey);
    if (type === 'date') {
      answer = formatDate(answer, 'MMM D, YYYY');
    }

    // Instructions
    if (type === 'instructions') {
      def = this.getInstructionDef(control);
    }
    // Selections
    else if (type === 'selectSingle' || type === 'selectMultiple' || type === 'ontology') {
      const multiple = type === 'selectMultiple' || (type === 'ontology' && options.hasMultipleSelections);

      if (layout.showAll) {
        def = this.getSelectDef(answer, source, layout.columns, multiple);
      } else {
        const value = transformValueToLabel(answer, source);
        def = this.getAnswerDef(value);
      }
    }
    // File
    else if (type === 'file' || type === 'image') {
      const multiple = getProperty(options, 'source.allowMultiple', false);
      def = await this.getFileDef(answer, multiple, layout.preview);
    }
    // Matrix
    else if (type === 'matrix') {
      def = layout.table ? await this.getMatrixTableDef(answer, options) : await this.getMatrixListDef(answer, options);
    }
    // GeoJSON, FarmOS etc
    else if (type === 'script' || typeof answer === 'object') {
      def = this.getObjectDef(answer);
    }
    // Other
    else {
      def = this.getAnswerDef(answer);
    }

    if (def) {
      this.docDefinition.content.push(def);
    }
    this.docDefinition.content.push({ text: '', margin: margins.lg });
  }

  /*******************************************************************/
  /***************************     Def     ***************************/
  /*******************************************************************/

  getSectionDef(control) {
    return {
      layout: {
        hLineWidth: function () {
          return 1;
        },
        vLineWidth: function () {
          return 1;
        },
        hLineColor: function () {
          return colors.gray;
        },
        vLineColor: function () {
          return colors.gray;
        },
      },
      table: {
        body: [
          [
            {
              text: `${control.index.join('.')}${control.label ? `. ${control.label}` : ''}`,
              style: 'section',
              fontSize: fontSizes.sm,
            },
          ],
        ],
      },
      headlineLevel: LVL.section,
      margin: margins.xs,
    };
  }

  getAnswerDef(answer, placeholder = 'No answer') {
    const value = toArray(answer);
    const hasAnswer = value.length > 0;

    return {
      text: value.join(', ') || placeholder,
      style: hasAnswer ? 'answer' : 'answerEmpty',
    };
  }

  getInstructionDef(control) {
    return control.options.source ? htmlToPdfMake(control.options.source, { window }) : [];
  }

  getSelectItemDef(option, multiple, checked) {
    return {
      table: {
        widths: [12, 'auto'],
        body: [
          [
            {
              svg: getControlSvg(multiple, checked),
              fit: [14, 14],
              margin: [0, 0.5, 0, 0],
            },
            {
              ...this.getAnswerDef(option.label),
              margin: margins.zero,
            },
          ],
        ],
      },
      layout: 'noBorders',
    };
  }

  getSelectDef(answer, source, cols = 1, multiple) {
    const value = toArray(answer);
    const options = [...source];

    const custom = value.find((val) => val && source.every((item) => item.value !== val));
    if (custom) {
      options.push({ value: custom, label: custom });
    }

    const group = [];
    if (cols === 1) {
      group.push(options);
    } else {
      options.forEach((option, index) => {
        const i = index % cols;
        if (!Array.isArray(group[i])) {
          group[i] = [];
        }
        group[i].push(option);
      });
    }

    const isChecked = (option) => value.includes(option.value);

    return {
      columns: group.map((columnOptions) =>
        columnOptions.map((option) => this.getSelectItemDef(option, multiple, isChecked(option)))
      ),
      margin: margins.answer,
    };
  }

  async getFileDef(answer, multiple, preview) {
    const value = toArray(answer);
    if (value.length === 0) {
      return this.getAnswerDef(value);
    }

    const ul = [];

    for (let i = 0; i < value.length; i++) {
      const file = value[i];
      const ext = (file.split('.').pop() || '').toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg'].includes(ext);
      const url = getPublicDownloadUrl(file);
      const stack = [
        {
          text: file,
          link: url,
          style: 'link',
        },
      ];
      if (isImage && preview) {
        try {
          const { data } = await axios.get(url, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(data, 'binary').toString('base64');
          stack.push({
            image: `data:image/${ext};base64,` + buffer,
            fit: [300, 300],
            margin: [0, 8, 0, 8],
          });
        } catch (e) {
          console.error('Fetching remote file failed', url, e);
        }
      }

      ul.push({ stack, margin: margins.answer });
    }

    return multiple ? { ul } : ul[0];
  }

  getObjectDef(answer) {
    if (!answer) {
      return this.getAnswerDef(answer);
    }

    return {
      table: {
        body: [
          [
            {
              text: JSON.stringify(answer).trim(),
              style: 'code',
            },
          ],
        ],
      },
      layout: 'noBorders',
      fillColor: colors.code,
      margin: margins.answer,
    };
  }

  getNoDataRowDef(cols) {
    const noDataCell = {
      ...this.getAnswerDef(null),
      colSpan: cols,
      alignment: 'center',
      margin: [0, 4, 0, 4],
    };
    const emptyCells = Array(cols)
      .fill(0)
      .map(() => '');

    return [noDataCell, ...emptyCells].slice(0, -1);
  }

  getEmptyDataRowDef(cols) {
    const emptyCell = {
      text: '',
      colSpan: cols,
      margin: [0, 12, 0, 12],
    };
    const emptyCells = Array(cols)
      .fill(0)
      .map(() => '');

    return [emptyCell, ...emptyCells].slice(0, -1);
  }
  async getMatrixTableDef(answer, options) {
    const cols = getProperty(options, 'source.content');
    if (!Array.isArray(cols)) {
      return null;
    }

    // const headers = cols.map((header) => getCellDef(header.label || header.value));
    const headers = cols.map((header) => header.label || header.value);
    const rows = [];
    const value = toArray(answer);
    const isPrintable = this.options.printable;

    for (const item of value) {
      const row = [];

      for (const col of cols) {
        let colValue = getProperty(item, `${col.value}.value`);
        if (col.type === 'dropdown') {
          const dropdownVal = toArray(colValue);
          const resource = await this.getControlSource(col);
          const text = transformValueToLabel(dropdownVal, resource);
          colValue = text.join(', ');
        } else if (col.type === 'date') {
          colValue = formatDate(colValue, 'MMM D, YYYY');
        } else if (colValue && typeof colValue === 'object') {
          colValue = JSON.stringify(colValue).trim();
        }
        row.push(colValue);
      }

      rows.push(row);
    }

    if (rows.length === 0) {
      if (isPrintable) {
        rows.push(...Array(10).fill(this.getEmptyDataRowDef(cols.length)));
      } else {
        rows.push(this.getNoDataRowDef(cols.length));
      }
    }

    return {
      layout: {
        hLineWidth: function () {
          return 1;
        },
        vLineWidth: function () {
          return 0;
        },
        hLineColor: function (i, node) {
          return i === 0 || i === 1 || i === node.table.body.length ? colors.darkGray : colors.gray;
        },
        hLineStyle: function (i, node) {
          return !isPrintable || i === 0 || i === 1 || i === node.table.body.length ? null : lines.dash;
        },
        fillColor: function (rowIndex) {
          return rowIndex === 0
            ? colors.table.headerColor
            : isPrintable
            ? colors.white
            : rowIndex % 2 === 1
            ? colors.table.oddColor
            : colors.table.evenColor;
        },
      },
      table: {
        widths: Array(cols.length).fill(`${100.0 / cols.length}%`),
        headerRows: 1,
        body: [headers, ...rows],
      },
      fontSize: fontSizes.xxs,
    };
  }

  async getMatrixListDef(answer, options) {
    const value = toArray(answer);
    if (value.length === 0) {
      return this.getAnswerDef(null);
    }

    const cols = getProperty(options, 'source.content');
    if (!Array.isArray(cols) || cols.length === 0) {
      return this.getAnswerDef(null);
    }

    const rows = [];

    for (let i = 0; i < value.length; i++) {
      const row = [];

      for (const col of cols) {
        let colValue = getProperty(value, `${i}.${col.value}.value`, null);
        if (!colValue) {
          continue;
        }
        if (col.type === 'dropdown') {
          const dropdownVal = toArray(colValue);
          const resource = await this.getControlSource(col);
          const text = transformValueToLabel(dropdownVal, resource);
          colValue = text.join(', ');
        } else if (col.type === 'date') {
          colValue = formatDate(colValue, 'MMM D, YYYY');
        } else if (typeof colValue === 'object') {
          colValue = this.getObjectDef(colValue);
        }

        row.push({
          text: [`${col.label || col.value}: `, colValue],
        });
      }

      rows.push(`Row ${i + 1}`);

      if (row.length > 0) {
        rows.push({ type: 'circle', ul: row, margin: [0, 0, 0, 4] });
      }
    }

    return {
      ul: rows,
      style: 'answer',
    };
  }

  getPrintableAnswerDef() {
    return {
      layout: {
        hLineWidth: function () {
          return 1;
        },
        hLineColor: function () {
          return colors.gray;
        },
        hLineStyle: function () {
          return lines.dash;
        },
      },
      table: {
        widths: ['*'],
        body: [
          [
            {
              border: [false, false, false, true],
              text: ' ',
              fontSize: fontSizes.xl,
            },
          ],
          [
            {
              border: [false, false, false, true],
              text: ' ',
              fontSize: fontSizes.xl,
            },
          ],
        ],
      },
      margin: margins.answer,
    };
  }

  getPrintableNumberDef() {
    return {
      layout: {
        hLineWidth: function () {
          return 1;
        },
        hLineColor: function () {
          return colors.gray;
        },
        hLineStyle: function () {
          return lines.dash;
        },
      },
      table: {
        widths: [120],
        body: [
          [
            {
              border: [false, false, false, true],
              text: ' ',
              fontSize: fontSizes.xl,
            },
          ],
        ],
      },
      margin: margins.answer,
    };
  }

  getPrintableDateDef() {
    return {
      layout: {
        hLineWidth: function () {
          return 1;
        },
        hLineColor: function () {
          return colors.gray;
        },
        hLineStyle: function () {
          return lines.dash;
        },
      },
      table: {
        widths: [25, 'auto', 25, 'auto', 50],
        body: [
          [
            {
              border: [false, false, false, true],
              text: ' ',
              fontSize: fontSizes.xl,
            },
            {
              border: [false, false, false, false],
              text: '/',
              fontSize: fontSizes.sm,
              margin: [0, 12, 0, 0],
            },
            {
              border: [false, false, false, true],
              text: ' ',
              fontSize: fontSizes.xl,
            },
            {
              border: [false, false, false, false],
              text: '/',
              fontSize: fontSizes.sm,
              margin: [0, 12, 0, 0],
            },
            {
              border: [false, false, false, true],
              text: ' ',
              fontSize: fontSizes.xl,
            },
          ],
        ],
      },
      margin: margins.answer,
    };
  }

  /*******************************************************************/
  /*************************     Helpers     *************************/
  /*******************************************************************/

  getValidControls(controls, path = []) {
    // Filter hidden
    let validControls = controls.filter((control) => !this.isHiddenControl.bind(this)(control));

    // Filter relevant
    if (!this.options.printable) {
      validControls = [...validControls].filter((control) => this.isRelevantControl.bind(this)(control, path));

      // Filter instructions
      if (!this.survey.options.showInstruction) {
        validControls = [...validControls].filter(
          (control) => control.type !== 'instructions' && control.type !== 'instructionsImageSplit'
        );
      }

      // Filter unanswered
      if (this.survey.options.hideUnanswered) {
        validControls = [...validControls].filter((control) => this.hasAnswer.bind(this)(control, path));
      }
    }

    return validControls;
  }

  async getControlSource(control) {
    const source = getProperty(control, 'options.source', control.resource);

    if (Array.isArray(source)) {
      return source;
    }

    if (typeof source !== 'string') {
      return [];
    }

    // Cache resources
    if (Array.isArray(this.resourcesMap[source])) {
      return this.resourcesMap[source];
    }

    const resource = await getResource(this.survey.resources, source);
    this.resourcesMap[source] = resource;

    return resource;
  }

  getControlLayout(control) {
    const { hidden, showAll, columns, preview, table } = {
      hidden: false,
      showAll: false,
      columns: 1,
      preview: false,
      table: true,
      ...control.options.layout,
    };

    return {
      hidden,
      columns,
      showAll,
      preview,
      table,
    };
  }

  isFirstControl() {
    return this.metaIndex === this.docDefinition.content.length;
  }

  isRootControl(control) {
    return control.index.length === 1;
  }

  isContainerControl(control) {
    return control.type === 'page' || control.type === 'group';
  }

  isHiddenControl(control) {
    const layout = this.getControlLayout(control);
    return getProperty(control, 'options.hidden', false) || layout.hidden;
  }

  isRelevantControl(control, path = []) {
    const relevantKey = [...path, control.name, 'meta', 'relevant'];
    return getProperty(this.submission.data, relevantKey, true);
  }

  hasAnswer(control, path = []) {
    const answerKey = [...path, control.name, 'value'];
    if (control.type === 'location') {
      answerKey.push('geometry', 'coordinates');
    }
    let answer = getProperty(this.submission.data, answerKey);
    return toArray(answer).length > 0;
  }
}

export async function downloadPdf(survey, submission) {
  const generator = new PdfGenerator({ survey, submission });
  await generator.download();
}
