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
  },
  answerEmpty: {
    background: colors.lightGray,
    color: colors.black,
    margin: margins.xs,
  },
  answerHighlight: {
    background: colors.blue,
    color: colors.white,
    margin: margins.xs,
  },
  link: {
    color: colors.blue,
    decoration: 'underline',
  },
  code: {
    fontSize: fontSizes.xxs,
    color: colors.black,
    margin: [16, 4, 16, 4],
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

function isRootControl(control) {
  return control.index.length === 1;
}

function isContainerControl(control) {
  return control.type === 'page' || control.type === 'group';
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

function getSectionDef(control) {
  const fontSize = control.index.length === 1 ? fontSizes.md : fontSizes.sm;
  const text = `${control.index.join('.')}${control.label ? `. ${control.label}` : ''}`;

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
            text,
            style: 'section',
            fontSize,
          },
        ],
      ],
    },
    headlineLevel: LVL.section,
    margin: margins.xs,
  };
}

function getAnswerDef(answer, placeholder = 'No answer') {
  const value = toArray(answer);
  const hasAnswer = value.length > 0;

  return {
    text: value.join(', ') || placeholder,
    style: hasAnswer ? 'answer' : 'answerEmpty',
  };
}

function getInstructionDef(control) {
  return control.options.source ? htmlToPdfMake(control.options.source) : [];
}

function getSelectItemDef(option, multiple, checked) {
  return {
    table: {
      widths: [12, 'auto'],
      body: [
        [
          {
            svg: getControlSvg(multiple, checked),
            fit: [16, 16],
          },
          getAnswerDef(option.label),
        ],
      ],
    },
    layout: 'noBorders',
  };
}

function getSelectDef(answer, source, cols = 1, multiple) {
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
      columnOptions.map((option) => getSelectItemDef(option, multiple, isChecked(option)))
    ),
  };
}

function getDropdownDef(answer, source, cols = 1) {
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
        const d = getAnswerDef(option.label);
        if (isChecked(option)) {
          d.style = 'answerHighlight';
        }
        return d;
      }),
    })),
  };
}

function getFileDef(answer, multiple, preview) {
  const value = toArray(answer);
  if (value.length === 0) {
    return getAnswerDef(value);
  }

  const def = { ul: [] };
  const images = {};

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
      images[image] = url;
      stack.push({ image, fit: [300, 300], margin: [0, 8, 0, 8] });
    }
    def.ul.push({ stack });
  });

  return {
    images,
    def: multiple ? def : def.ul[0],
  };
}

function getGeoJsonDef(answer) {
  if (!answer) {
    return getAnswerDef(answer);
  }

  return {
    table: {
      body: [
        [
          {
            text: JSON.stringify(answer, null, 2),
            style: 'code',
            preserveLeadingSpaces: true,
          },
        ],
      ],
    },
    layout: 'noBorders',
    fillColor: colors.code,
  };
}

function getEmptyRowDef(cols) {
  const noDataCell = {
    ...getAnswerDef(null),
    colSpan: cols,
    alignment: 'center',
    margin: [0, 4, 0, 4],
  };
  const emptyCells = Array(cols)
    .fill(0)
    .map(() => '');

  return [noDataCell, ...emptyCells].slice(0, -1);
}

export default class SubmissionPDF {
  survey;
  submission;
  docDefinition;
  metaIndex;

  constructor(survey, submission) {
    this.initialize();
    this.survey = survey;
    this.submission = submission;
  }

  initialize() {
    this.metaIndex = 0;
    this.docDefinition = {
      content: [],
      styles,
      defaultStyle,
      images: {},
      pageBreakBefore: this.pageBreakBefore.bind(this),
    };
  }

  async download() {
    const maker = await this.generate();
    if (maker) {
      maker.download();
    }
  }

  async print() {
    const maker = await this.generate();
    if (maker) {
      maker.print();
    }
  }

  async generate() {
    if (!this.survey || !this.submission) {
      return null;
    }

    this.initialize();
    this.generateInfo();
    this.generateMeta();

    const revision = this.survey.revisions.find((revision) => revision.version === this.submission.meta.survey.version);

    if (revision && Array.isArray(revision.controls)) {
      const visibleControls = revision.controls.filter((control) => !getProperty(control, 'options.hidden', false));
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
    const metaDate = formatDate(dateSubmitted || dateModified || dateCreated || new Date().toISOString());

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
    if (isContainerControl(control)) {
      this.docDefinition.content.push(getSectionDef(control));

      if (!Array.isArray(control.children)) {
        return;
      }

      const visibleChildren = control.children.filter((child) => !getProperty(child, 'options.hidden', false));

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

    const len = this.docDefinition.content.length;
    if (isRootControl(control)) {
      // Root
      this.docDefinition.content.push(getSectionDef(control));
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
      answer = formatDate(answer, 'MMM d, yyyy');
    }

    if (type === 'instructions') {
      // Instructions
      this.docDefinition.content.push(getInstructionDef(control));
    } else if (type === 'selectSingle' || type === 'selectMultiple' || type === 'ontology') {
      // Selections
      const source = await this.getControlSource(control);
      const layout = this.getControlLayout(control);
      const multiple = type === 'selectMultiple' || (type === 'ontology' && options.hasMultipleSelections);

      if (layout.valuesOnly) {
        const value = transformValueToLabel(answer, source);
        this.docDefinition.content.push(getAnswerDef(value));
      } else if (type !== 'ontology' || (type === 'ontology' && layout.usingControl)) {
        this.docDefinition.content.push(getSelectDef(answer, source, layout.columnCount, multiple));
      } else {
        this.docDefinition.content.push(getDropdownDef(answer, source, layout.columnCount));
      }
    } else if (type === 'file' || type === 'image') {
      // File
      const multiple = getProperty(options, 'source.allowMultiple', false);
      const layout = this.getControlLayout(control);
      const { images, def } = getFileDef(answer, multiple, layout.preview);

      this.docDefinition.images = { ...this.docDefinition.images, ...images };
      this.docDefinition.content.push(def);
    } else if (type === 'geoJSON') {
      // GeoJSON
      this.docDefinition.content.push(getGeoJsonDef(answer));
    } else if (type === 'matrix') {
      // Matrix
      const def = await this.getMatrixDef(answer, options);
      if (def) {
        this.docDefinition.content.push(def);
      }
    } else {
      this.docDefinition.content.push(getAnswerDef(answer));
    }

    this.docDefinition.content.push('\n');
  }

  async getMatrixDef(answer, options) {
    const cols = getProperty(options, 'source.content');
    if (!Array.isArray(cols)) {
      return null;
    }

    // const headers = cols.map((header) => getCellDef(header.label || header.value));
    const headers = cols.map((header) => header.label || header.value);
    const rows = [];
    const value = toArray(answer);

    for (const item of value) {
      const row = [];

      for (const col of cols) {
        let colValue = getProperty(item, `${col.value}.value`);
        if (col.type === 'dropdown') {
          const dropdownVal = toArray(colValue);
          const dropdownSource = await this.getControlSource(col);
          const text = transformValueToLabel(dropdownVal, dropdownSource);
          row.push(text.join(', '));
        } else {
          if (col.type === 'date') {
            colValue = formatDate(colValue, 'MMM d, yyyy');
          }
          row.push(colValue);
        }
      }

      rows.push(row);
    }

    if (rows.length === 0) {
      rows.push(getEmptyRowDef(cols.length));
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

  isFirstControl() {
    return this.metaIndex === this.docDefinition.content.length;
  }
}
