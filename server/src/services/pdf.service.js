import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfMake from 'html-to-pdfmake';
import dayjs from 'dayjs';
import axios from 'axios';
import getProperty from 'lodash/get';
import groupBy from 'lodash/groupBy';
import { JSDOM } from 'jsdom';
import { ObjectId } from 'mongodb';
import { db } from '../db';
import { getPublicDownloadUrl } from './bucket.service';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const { window } = new JSDOM('');

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
  answerHighlight: {
    background: colors.blue,
    color: colors.white,
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

function formatDate(date, format = 'MMM D, YYYY h:mm A') {
  const parsedDate = dayjs(date);

  return parsedDate.isValid() && parsedDate.toISOString() === date
    ? parsedDate.format(format)
    : date;
}

function transformValueToLabel(value, source) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => transformValueToLabel(item, source));
  }

  const match = source.find((option) => option.value === value);
  return match ? match.label : value;
}

function toArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

const SEPARATOR = '.';

// http://blog.nicohaemhouts.com/2015/08/03/accessing-nested-javascript-objects-with-string-key/
function getNested(obj, path, fallback = undefined) {
  try {
    return path
      .replace('[', SEPARATOR)
      .replace(']', '')
      .split(SEPARATOR)
      .reduce((item, property) => (item[property] === undefined ? fallback : item[property]), obj);
  } catch (err) {
    return fallback;
  }
}

async function getSubmissionUniqueItems(surveyId, path) {
  const data = await db
    .collection('submissions')
    .find({ 'meta.survey.id': new ObjectId(surveyId), 'meta.archived': { $ne: true } })
    .project({ [`${path}.value`]: 1 })
    .toArray();

  const items = data
    .map((item) => {
      const value = getNested(item, `${path}.value`, null);
      return {
        id: item._id,
        label: JSON.stringify(value).replace(/^"(.+(?="$))"$/, '$1'),
        value,
      };
    })
    .filter((item) => item.value !== null);

  const explodeItem = (item) =>
    item.value
      .map((v, i) => ({
        id: `${item.id}__${i}`,
        // stringify and remove wrapping quote characters so that strings are rendered without quotation marks
        label: JSON.stringify(v).replace(/^"(.+(?="$))"$/, '$1'),
        value: v,
      }))
      .filter((v) => v.value);

  const explodedItems = items
    .map((it) => (Array.isArray(it.value) ? explodeItem(it) : [it]))
    .reduce((acc, curr) => [...acc, ...curr], []);

  const uniqueItems = Object.values(groupBy(explodedItems, 'label')).map((group) => ({
    ...group[0],
    label: group[0].label,
    count: group.length,
  }));

  return uniqueItems;
}

class PdfGenerator {
  constructor(survey, submission) {
    this.initialize();
    this.survey = survey;
    this.submission = submission;
    this.disabled = !this.survey || !this.submission;
  }

  initialize() {
    this.metaIndex = 0;
    this.docDefinition = {
      content: [],
      styles,
      defaultStyle,
      pageBreakBefore: this.pageBreakBefore.bind(this),
    };
  }

  async generateBlob(callback) {
    const pdf = await this.pdf();
    if (!pdf) {
      return null;
    }
    pdf.getBlob(callback);
  }

  async generateBase64(callback) {
    const pdf = await this.pdf();
    if (!pdf) {
      return null;
    }
    pdf.getBase64(callback);
  }

  async pdf() {
    if (this.disabled) {
      return null;
    }

    this.initialize();
    this.generateInfo();
    this.generateMeta();

    const revision = this.survey.revisions.find(
      (revision) => revision.version === this.submission.meta.survey.version
    );

    if (revision && Array.isArray(revision.controls)) {
      const visibleControls = revision.controls.filter(
        (control) => !this.isHiddenControl.bind(this)(control)
      );
      for (let index = 0; index < visibleControls.length; index += 1) {
        const control = visibleControls[index];
        await this.generateControl({
          ...control,
          index: [index + 1],
        });
      }
    }

    return pdfMake.createPdf(this.docDefinition);
  }

  filename() {
    if (this.disabled) {
      return `${this.survey.name} - SurveyStack report`;
    }

    const { dateSubmitted, dateModified, dateCreated } = this.submission.meta;
    const date = (dateSubmitted || dateModified || dateCreated || new Date()).toISOString();

    return `${this.survey.name}-${this.submission._id.toString().slice(-6)}-${formatDate(
      date,
      'YYYY-MM-DD-HH-mm-ss'
    )}`;
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

  generateMeta() {
    const { dateSubmitted, dateModified, dateCreated } = this.submission.meta;
    const metaDate = formatDate(
      (dateSubmitted || dateModified || dateCreated || new Date()).toISOString()
    );

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
                [
                  'Submitted to',
                  `${this.submission.meta.group.name} (${this.submission.meta.group.path})`,
                ],
                ['Submitted on', metaDate],
                [
                  'Submitted by',
                  {
                    text: [
                      this.submission.meta.creator.name,
                      { text: ` (${this.submission.meta.creator.email})`, color: colors.lightBlue },
                    ],
                  },
                ],
                [
                  'Generated by',
                  {
                    text: [
                      'SurveyStack',
                      { text: ' (www.surveystack.io)', color: colors.lightBlue },
                    ],
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
      return followingNodesOnPage.length <= 2;
    }

    if (currentNode.headlineLevel === LVL.block) {
      return followingNodesOnPage.length <= 1;
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

      const visibleChildren = control.children.filter(
        (child) => !this.isHiddenControl.bind(this)(child)
      );
      for (let index = 0; index < visibleChildren.length; index += 1) {
        const child = visibleChildren[index];
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

    // Answer / Content
    const answerKey = [...path, name, 'value'];
    if (type === 'location') {
      answerKey.push('geometry', 'coordinates');
    }
    let answer = getProperty(this.submission.data, answerKey);
    if (type === 'date') {
      answer = formatDate(answer, 'MMM D, YYYY');
    }

    let def = null;
    if (type === 'instructions') {
      // Instructions
      def = this.getInstructionDef(control);
    } else if (type === 'selectSingle' || type === 'selectMultiple' || type === 'ontology') {
      // Selections
      const multiple =
        type === 'selectMultiple' || (type === 'ontology' && options.hasMultipleSelections);

      if (layout.valuesOnly) {
        const value = transformValueToLabel(answer, source);
        def = this.getAnswerDef(value);
      } else if (type !== 'ontology' || (type === 'ontology' && layout.usingControl)) {
        def = this.getSelectDef(answer, source, layout.columnCount, multiple);
      } else {
        def = this.getDropdownDef(answer, source, layout.columnCount);
      }
    } else if (type === 'file' || type === 'image') {
      // File
      const multiple = getProperty(options, 'source.allowMultiple', false);
      def = await this.getFileDef(answer, multiple, layout.preview);
    } else if (type === 'matrix') {
      // Matrix
      def = layout.table
        ? await this.getMatrixTableDef(answer, options)
        : await this.getMatrixListDef(answer, options);
    } else if (type === 'script' || typeof answer === 'object') {
      // GeoJSON, FarmOS etc
      def = this.getObjectDef(answer);
    } else {
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
              fit: [16, 16],
            },
            this.getAnswerDef(option.label),
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

  getDropdownDef(answer, source, cols = 1) {
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
      const countPerCol = Math.ceil(options.length / cols);
      options.forEach((option, index) => {
        const i = Math.floor(index / countPerCol);
        if (!Array.isArray(group[i])) {
          group[i] = [];
        }
        group[i].push(option);
      });
    }

    const isChecked = (option) => value.includes(option.value);

    return {
      columns: group.map((columnOptions) => ({
        ul: columnOptions.map((option) => {
          const d = this.getAnswerDef(option.label);
          if (isChecked(option)) {
            d.style = 'answerHighlight';
          }
          return d;
        }),
      })),
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

  getEmptyRowDef(cols) {
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

  async getMatrixTableDef(answer, options) {
    const cols = getProperty(options, 'source.content');
    if (!Array.isArray(cols)) {
      return null;
    }

    // const headers = cols.map((header) => getCellDef(header.label || header.value));
    const headers = cols.map((header) => header.label || header.value);
    const rows = [];
    const value = toArray(answer);

    // To fetch dropdown list items in advance for performance issue
    const resources = {};
    const dropdownCols = cols.filter((col) => col.type === 'dropdown');
    for (let i = 0; i < dropdownCols.length; i++) {
      const col = dropdownCols[i];
      const resource = await this.getControlSource(col);
      resources[col.resource] = resource;
    }

    for (const item of value) {
      const row = [];

      for (const col of cols) {
        let colValue = getProperty(item, `${col.value}.value`);
        if (col.type === 'dropdown') {
          const dropdownVal = toArray(colValue);
          const text = transformValueToLabel(dropdownVal, resources[col.resource]);
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
      rows.push(this.getEmptyRowDef(cols.length));
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
          return i === 0 || i === node.table.body.length ? colors.darkGray : colors.gray;
        },
        fillColor: function (rowIndex) {
          return rowIndex === 0
            ? colors.table.headerColor
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

    // To fetch dropdown list items in advance for performance issue
    const resources = {};
    const dropdownCols = cols.filter((col) => col.type === 'dropdown');
    for (let i = 0; i < dropdownCols.length; i++) {
      const col = dropdownCols[i];
      const resource = await this.getControlSource(col);
      resources[col.resource] = resource;
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
          const text = transformValueToLabel(dropdownVal, resources[col.resource]);
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

  /*******************************************************************/
  /*************************     Helpers     *************************/
  /*******************************************************************/

  async getControlSource(control) {
    const source = getProperty(control, 'options.source', control.resource);
    if (Array.isArray(source)) {
      return source;
    }

    if (typeof source !== 'string') {
      return [];
    }

    const resources = this.survey.resources;
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
        return await getSubmissionUniqueItems(resource.content.id, resource.content.path);
      } catch {
        return [];
      }
    }

    return [];
  }

  getControlLayout(control) {
    const { hidden, valuesOnly, usingControl, columnCount, preview, table } = {
      hidden: false,
      valuesOnly: true,
      usingControl: false,
      columnCount: 1,
      preview: false,
      table: true,
      ...control.options.layout,
    };

    return {
      hidden,
      columnCount,
      valuesOnly,
      usingControl,
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
}

function getPdfBase64(survey, submission, callback) {
  const generator = new PdfGenerator(survey, submission);
  generator.generateBase64(callback);
}

function getPdfBlob(survey, submission, callback) {
  const generator = new PdfGenerator(survey, submission);
  generator.generateBlob(callback);
}

function getPdfName(survey, submission) {
  const generator = new PdfGenerator(survey, submission);
  return generator.filename() + '.pdf';
}

export default {
  getPdfBase64,
  getPdfBlob,
  getPdfName,
};
