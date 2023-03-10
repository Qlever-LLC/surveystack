import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import dateFnsFormat from 'date-fns/format';
import getProperty from 'lodash/get';
import { fetchSubmissionUniqueItems } from './submissions';
import { getPublicDownloadUrl } from '@/utils/resources';
import htmlToPdfMake from 'html-to-pdfmake';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// export async function generateSubmissionPdf(submissionId) {
//   const { data } = await api.getProperty(`/submissions/${id}?pure=1`);
// }

const styles = {
  header: {
    fontSize: 20,
    bold: true,
    alignment: 'center',
    margin: [0, 0, 0, 12],
  },
  meta: {
    fontSize: 8,
    color: '#9ca3af',
    margin: [0, 0, 0, 48],
  },
  toc: {
    fontSize: 16,
    lineHeight: 1.5,
    italics: true,
    alignment: 'center',
    decoration: 'underline',
    decorationStyle: 'double',
    margin: [0, 0, 0, 16],
  },
  group: {
    fontSize: 14,
    bold: true,
    alignment: 'center',
    margin: [0, 0, 0, 16],
  },
  question: {
    bold: true,
    color: 'blue',
    margin: [0, 0, 0, 8],
  },
  answer: {
    color: '#1e293b',
  },
  link: {
    color: 'blue',
    decoration: 'underline',
  },
  code: {
    background: '#f5f5f5',
  },
  table: {
    headerColor: '#d1d5db',
    evenColor: '#f3f4f6',
    oddColor: '#white',
  },
};

const defaultStyle = {
  fontSize: 12,
  bold: false,
  color: 'black',
};

const SVG = {
  'check-true':
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17.99 9L16.58 7.58L9.99 14.17L7.41 11.6L5.99 13.01L9.99 17L17.99 9Z" fill="#374151"/></g></svg>',
  'check-false':
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="#374151"/></g></svg>',
  'radio-true':
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#374151"/><path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#374151"/></g></svg>',
  'radio-false':
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><g><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#374151"/></g></svg>',
};

const LVL = {
  page: 1,
  group: 2,
  question: 3,
};

function getControlSvg(multiple, checked) {
  return SVG[`${multiple ? 'check' : 'radio'}-${Boolean(checked)}`];
}

function formatDate(date, format = 'MMM d, yyyy h:mm a') {
  const parsedDate = parseISO(date);
  return dateFnsFormat(isValid(parsedDate) ? parsedDate : new Date(), format);
}

export default class SubmissionPDF {
  survey;
  submission;
  questionIndex;
  toc;
  docDefinition;

  constructor(survey, submission) {
    this.initialize();
    this.survey = survey;
    this.submission = submission;
  }

  set survey(val) {
    this.survey = val;
  }

  set submission(val) {
    this.submission = val;
  }

  set questionIndex(val) {
    this.questionIndex = val;
  }

  set toc(val) {
    this.toc = val;
  }

  set docDefinition(val) {
    this.docDefinition = val;
  }

  initialize() {
    this.questionIndex = 0;
    this.toc = [];
    this.docDefinition = {
      content: [],
      styles,
      defaultStyle,
      images: {},
      // pageBreakBefore: this.pageBreakBefore.bind(this),
    };
  }

  async download() {
    try {
      const maker = await this.generate();
      maker.download();
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  }

  async print() {
    try {
      const maker = await this.generate();
      maker.print();
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  }

  async generate() {
    if (!this.survey || !this.submission) {
      return;
    }

    this.initialize();
    this.generateInfo();

    const metaIndex = this.generateMeta();
    const revision = this.survey.revisions.find((revision) => revision.version === this.submission.meta.survey.version);

    if (revision && Array.isArray(revision.controls)) {
      for (const control of revision.controls) {
        await this.generateControl(control);
      }
    }

    this.generateToc(metaIndex);
    console.log(77777, this.docDefinition);
    return pdfMake.createPdf(this.docDefinition);
  }

  /*******************************************************************/
  /********************     Document meta info     *******************/
  /*******************************************************************/

  generateInfo() {
    this.docDefinition.info = {
      title: `${this.survey.name} - SurveyStack report`,
      author: 'Our-Sci SurveyStack team',
      subject: `Report of the SurveyStack survey`,
      keywords: 'SurveyStack, Survey, FarmOS, OurSci, what else?',
    };
  }

  generateMeta() {
    const { dateSubmitted, dateModified, dateCreated } = this.submission.meta;
    const metaDate = formatDate(dateSubmitted || dateModified || dateCreated);

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
                ['Submitted to', this.submission.meta.group.path],
                ['Submitted at', metaDate],
                ['Generated by', 'SurveyStack'],
              ],
            },
            layout: 'noBorders',
            style: 'meta',
          },
        ],
      }
    );

    return this.docDefinition.content.length;
  }

  generateToc(metaIndex) {
    if (this.toc.length > 0) {
      this.docDefinition.content.splice(metaIndex, 0, this.getTocDef());
    }

    return this.docDefinition.content.length;
  }

  /*******************************************************************/
  /****************     Header/ Footer/ Page break     ***************/
  /*******************************************************************/

  pageBreakBefore(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
    if (currentNode.headlineLevel === LVL.group) {
      return followingNodesOnPage.length <= 2;
    }

    if (currentNode.headlineLevel === LVL.question) {
      return followingNodesOnPage.length <= 1;
    }

    return false;
  }

  /*******************************************************************/
  /********************     Control generators     *******************/
  /*******************************************************************/

  async generateControl(control, path = []) {
    const hidden = getProperty(control, 'options.hidden', false);
    if (hidden) {
      return;
    }

    const generator = {
      page: this.generatePageControl,
      group: this.generateGroupControl,
      instructions: this.generateInstructionControl,
      instructionsImageSplit: this.generateInstructionSplitControl,
      string: this.generateNormalControl,
      number: this.generateNormalControl,
      date: this.generateDateControl,
      location: this.generateLocationControl,
      selectSingle: this.generateRadioControl,
      selectMultiple: this.generateCheckControl,
      ontology: this.generateDropdownControl,
      matrix: this.generateMatrixControl,
      image: this.generateFileControl,
      file: this.generateFileControl,
      geoJSON: this.generateGeoJsonControl,
    }[control.type];

    if (generator) {
      await generator.bind(this)(control, path);

      if (!['page', 'group'].includes(control.type)) {
        this.docDefinition.content.push('\n\n');
      }
    }

    if (Array.isArray(control.children)) {
      for (const child of control.children) {
        await this.generateControl(child, [...path, control.name]);
      }
    }
  }

  generatePageControl(control) {
    const { id, label } = control;
    this.toc.push({ id, label, lvl: LVL.page });

    const def = this.getPageDef(control);
    this.docDefinition.content.push(def);

    return this.docDefinition.content.length;
  }

  generateGroupControl(control) {
    const { id, label } = control;
    this.toc.push({ id, label, lvl: LVL.group });

    const def = this.getGroupDef(control, '\n');
    this.docDefinition.content.push(def);

    return this.docDefinition.content.length;
  }

  generateInstructionControl(control) {
    const defs = this.getInstructionDef(control);
    this.docDefinition.content.push(...defs);

    return this.docDefinition.content.length;
  }

  generateInstructionSplitControl(control) {
    this.docDefinition.content.push({ text: control.label, headlineLevel: LVL.question });

    return this.docDefinition.content.length;
  }

  generateNormalControl(control, path = []) {
    const value = this.getAnswer(control, path);
    this.docDefinition.content.push(this.getQuestionDef(control), this.getTextDef(value));

    return this.docDefinition.content.length;
  }

  generateDateControl(control, path = []) {
    const value = this.getAnswer(control, path);
    this.docDefinition.content.push(this.getQuestionDef(control), this.getDateDef(value));

    return this.docDefinition.content.length;
  }

  generateLocationControl(control, path = []) {
    const key = [...path, control.name, 'value', 'geometry', 'coordinates'];
    const value = getProperty(this.submission.data, key);
    this.docDefinition.content.push(this.getQuestionDef(control), this.getTextDef(value));

    return this.docDefinition.content.length;
  }

  async generateRadioControl(control, path = []) {
    const value = this.getAnswer(control, path);
    const source = await this.getControlSource(control);
    const layout = this.getControlLayout(control);

    this.docDefinition.content.push(this.getQuestionDef(control));
    if (layout.valuesOnly) {
      const answer = this.transformValueToLabel(value, source);
      this.docDefinition.content.push(this.getTextDef(answer));
    } else {
      this.docDefinition.content.push(this.getSelectDef(value, source, false, layout.columnCount));
    }
    this.docDefinition.content.push();

    return this.docDefinition.content.length;
  }

  async generateCheckControl(control, path = []) {
    const value = this.getAnswer(control, path);
    const source = await this.getControlSource(control);
    const layout = this.getControlLayout(control);

    this.docDefinition.content.push(this.getQuestionDef(control));
    if (layout.valuesOnly) {
      const answer = this.transformValueToLabel(value, source);
      this.docDefinition.content.push(this.getTextDef(answer));
    } else {
      this.docDefinition.content.push(this.getSelectDef(value, source, true, layout.columnCount));
    }

    return this.docDefinition.content.length;
  }

  async generateDropdownControl(control, path = []) {
    const value = this.getAnswer(control, path);
    const source = await this.getControlSource(control);
    const layout = this.getControlLayout(control);

    this.docDefinition.content.push(this.getQuestionDef(control));
    if (layout.valuesOnly) {
      const answer = this.transformValueToLabel(value, source);
      this.docDefinition.content.push(this.getTextDef(answer));
    } else if (layout.usingControl) {
      this.docDefinition.content.push(
        this.getSelectDef(value, source, control.options.hasMultipleSelections, layout.columnCount)
      );
    } else {
      this.docDefinition.content.push(this.getDropdownDef(value, source, layout.columnCount));
    }

    return this.docDefinition.content.length;
  }

  generateFileControl(control, path = []) {
    const value = this.getAnswer(control, path);
    const multiple = getProperty(control, 'options.source.allowMultiple', false);
    const layout = this.getControlLayout(control);

    this.docDefinition.content.push(this.getQuestionDef(control), this.getFileDef(value, multiple, layout.preview));

    return this.docDefinition.content.length;
  }

  generateGeoJsonControl(control, path = []) {
    const value = this.getAnswer(control, path);
    this.docDefinition.content.push(this.getQuestionDef(control), this.getGeoJsonDef(value));

    return this.docDefinition.content.length;
  }

  async generateMatrixControl(control, path = []) {
    const cols = getProperty(control, ['options', 'source', 'content']);
    if (!Array.isArray(cols)) {
      return;
    }

    const headers = cols.map((header) => this.getTextDef(header.label || header.value, true));
    const rows = [];

    const key = [...path, control.name, 'value'];
    const answer = getProperty(this.submission.data, key) || [];

    for (const item of answer) {
      const row = [];

      for (const col of cols) {
        const value = getProperty(item, [col.value, 'value']);
        if (col.type === 'date') {
          row.push(this.getDateDef(value, true, ''));
        } else if (col.type === 'dropdown') {
          const dropdownVal = this.getArrayValue(value);
          const dropdownSource = await this.getControlSource(col);
          const text = this.transformValueToLabel(dropdownVal, dropdownSource);
          row.push(this.getTextDef(text, true, ''));
        } else {
          row.push(this.getTextDef(value, true, ''));
        }
      }

      rows.push(row);
    }

    if (answer.length === 0) {
      rows.push(this.getNoDataTableRowDef(cols.length));
    }

    this.docDefinition.content.push(this.getQuestionDef(control), {
      layout: {
        hLineWidth: function (i, node) {
          return 1;
        },
        vLineWidth: function (i, node) {
          return 0;
        },
        hLineColor: function (i, node) {
          return i === 0 || i === node.table.body.length ? styles.answer.color : styles.meta.color;
        },
        fillColor: function (rowIndex, node, columnIndex) {
          return rowIndex === 0
            ? styles.table.headerColor
            : rowIndex % 2 === 1
            ? styles.table.oddColor
            : styles.table.evenColor;
        },
      },
      table: {
        widths: Array(cols.length).fill(`${100.0 / cols.length}%`),
        headerRows: 1,
        body: [headers, ...rows],
      },
    });

    return this.docDefinition.content.length;
  }

  /*******************************************************************/
  /**************     Definitions for each controls     **************/
  /*******************************************************************/

  getTocDef() {
    return {
      toc: {
        title: { text: '  Table of contents  ', style: 'toc' },
      },
    };
  }

  getPageDef() {
    return {
      text: ' ',
      headlineLevel: LVL.page,
      pageBreak: 'before',
    };
  }

  getGroupDef(control) {
    return {
      text: control.label,
      tocItem: true,
      headlineLevel: LVL.group,
      style: 'group',
    };
  }

  getInstructionDef(control) {
    const d = [
      {
        text: control.label,
        headlineLevel: LVL.question,
        style: 'question',
        color: 'black',
      },
    ];

    if (control.options.source) {
      const parsed = htmlToPdfMake(control.options.source);
      d.push(...parsed);
    }

    return d;
  }

  getQuestionDef(control) {
    this.questionIndex += 1;

    return {
      text: `${this.questionIndex}. ${control.label || control.hint}`,
      style: 'question',
      headlineLevel: LVL.question,
    };
  }

  getTextDef(answer, dense = false, placeholder = 'No answer') {
    const value = this.getArrayValue(answer);
    const hasAnswer = value.length > 0;

    const d = {
      text: value.join(', ') || placeholder,
      color: hasAnswer ? styles.answer.color : styles.meta.color,
    };

    if (dense) {
      d.fontSize = 10;
    }

    return d;
  }

  getDateDef(answer, small = false, placeholder = 'No answer') {
    const date = parseISO(answer);
    const value = isValid(date) ? dateFnsFormat(date, 'MMM d, yyyy h:mm a') : null;

    return this.getTextDef(value, small, placeholder);
  }

  getSelectDef(answer, source, multiple, cols = 1) {
    const value = this.getArrayValue(answer);
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
    };
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
            this.getTextDef(option.label),
          ],
        ],
      },
      layout: 'noBorders',
    };
  }

  getDropdownDef(answer, source, cols = 1) {
    const value = this.getArrayValue(answer);
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
          const d = this.getTextDef(option.label);
          if (isChecked(option)) {
            d.decoration = 'underline';
          }
          return d;
        }),
      })),
    };
  }

  getFileDef(answer, multiple, preview) {
    const value = this.getArrayValue(answer);
    if (value.length === 0) {
      return this.getTextDef(value);
    }

    const def = { ul: [] };

    value.forEach((image) => {
      const ext = (image.split('.').pop() || '').toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg'].includes(ext);
      const url = getPublicDownloadUrl(image);
      const stack = [
        {
          text: image,
          link: url,
          style: 'link',
        },
      ];
      if (isImage && preview) {
        this.docDefinition.images[image] = url;
        stack.push({ image, fit: [300, 300], margin: [0, 8, 0, 8] });
      }
      def.ul.push({ stack });
    });

    return multiple ? def : def.ul[0];
  }

  getGeoJsonDef(answer) {
    if (!answer) {
      return this.getTextDef(answer);
    }

    return {
      table: {
        body: [
          [
            {
              text: JSON.stringify(answer, null, 2),
              preserveLeadingSpaces: true,
              fontSize: 10,
              color: 'black',
              margin: [16, 4, 16, 4],
            },
          ],
        ],
      },
      layout: 'noBorders',
      fillColor: styles.code.background,
    };
  }

  getNoDataTableRowDef(cols) {
    const noDataCell = {
      ...this.getTextDef(null, true),
      colSpan: cols,
      alignment: 'center',
      margin: [0, 4, 0, 4],
    };
    const emptyCells = Array(cols)
      .fill(0)
      .map(() => ({}));

    return [noDataCell, ...emptyCells].slice(0, -1);
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
        return await fetchSubmissionUniqueItems(resource.content.id, resource.content.path);
      } catch {
        return [];
      }
    }

    return [];
  }

  getControlLayout(control) {
    const layout = control.options.layout || {};
    const cols = Number(layout.columnCount);

    return {
      columnCount: isNaN(cols) ? 1 : cols,
      valuesOnly: layout.valuesOnly || false,
      usingControl: layout.usingControl || false,
      preview: layout.preview || false,
    };
  }

  getAnswer(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);

    return value;
  }

  getArrayValue(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  transformValueToLabel(value, source) {
    if (Array.isArray(value)) {
      return value.flatMap((item) => this.transformValueToLabel(item, source));
    }

    const match = source.find((option) => option.value === value);
    return match ? match.label : value;
  }
}
