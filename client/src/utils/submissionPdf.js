import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import dateFnsFormat from 'date-fns/format';
import getProperty from 'lodash/get';
import { fetchSubmissionUniqueItems } from './submissions';
import { getFileResource, getPublicDownloadUrl } from '@/utils/resources';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

// export async function generateSubmissionPdf(submissionId) {
//   const { data } = await api.getProperty(`/submissions/${id}?pure=1`);
// }

const styles = {
  header: {
    fontSize: 20,
    bold: true,
    alignment: 'center',
  },
  meta: {
    fontSize: 10,
    color: '#9ca3af',
  },
  question: {
    fontSize: 14,
    bold: true,
    margin: [0, 0, 0, 8],
  },
  answer: {
    color: '#1e293b',
  },
  link: {
    color: 'blue',
    decoration: 'underline',
  },
  table: {
    headerColor: '#d1d5db',
    evenColor: '#f3f4f6',
    oddColor: 'white',
  },
};

const defaultStyle = {
  fontSize: 12,
  bold: false,
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

function getControlSvg(multiple, checked) {
  return SVG[`${multiple ? 'check' : 'radio'}-${Boolean(checked)}`];
}

function formatDate(date, format = 'MMM d, yyyy h:mm a') {
  const parsedDate = parseISO(date);
  return dateFnsFormat(isValid(parsedDate) ? parsedDate : new Date(), format);
}

export default class SubmissionPDF {
  constructor(survey, submission) {
    this.survey = survey;
    this.submission = submission;
    this.isLoading = false;
    this.questionIndex = 0;
    this.docDefinition = {
      content: [],
      styles,
      defaultStyle,
      images: {},
    };
  }

  async download() {
    const maker = await this.generate();
    maker.download();
  }

  async print() {
    const maker = await this.generate();
    maker.print();
  }

  async generate() {
    this.docDefinition.content = [];

    if (this.survey && this.submission) {
      this.generateMeta();

      const revision = this.survey.revisions.find(
        (revision) => revision.version === this.submission.meta.survey.version
      );

      if (revision && Array.isArray(revision.controls)) {
        this.questionIndex = 0;
        this.isLoading = false;
        for (const control of revision.controls) {
          await this.generateControl(control);
        }
        this.isLoading = true;
      }
    }

    return pdfMake.createPdf(this.docDefinition);
  }

  generateMeta() {
    const metaGroup = `Submitted to: ${this.submission.meta.group.path}`;
    const { dateSubmitted, dateModified, dateCreated } = this.submission.meta;
    const metaDate = `Submitted at: ${formatDate(dateSubmitted || dateModified || dateCreated)}`;

    this.docDefinition.content.push(
      {
        text: `Survey: ${this.survey.name}`,
        style: 'header',
      },
      {
        text: `\n${metaGroup}\n${metaDate}`,
        style: 'meta',
      },
      '\n\n'
    );
  }

  async generateControl(control, path = []) {
    const generator = {
      string: this.generateNormalControl,
      number: this.generateNormalControl,
      date: this.generateDateControl,
      location: this.generateLocationControl,
      selectSingle: this.generateRadioControl,
      selectMultiple: this.generateCheckControl,
      ontology: this.generateDropdownControl,
      matrix: this.generateMatrixControl,
      image: this.generateImageControl,
    }[control.type];

    if (generator) {
      await generator.bind(this)(control, path);
    }

    if (Array.isArray(control.children)) {
      for (const child of control.children) {
        await this.generateControl(child, [...path, control.name]);
      }
    }
  }

  generateNormalControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);

    this.docDefinition.content.push(this.getQuestionDef(control), this.getTextDef(value), '\n\n');
  }

  generateDateControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);

    this.docDefinition.content.push(this.getQuestionDef(control), this.getDateDef(value), '\n\n');
  }

  generateLocationControl(control, path = []) {
    const key = [...path, control.name, 'value', 'geometry', 'coordinates'];
    const value = getProperty(this.submission.data, key);

    this.docDefinition.content.push(this.getQuestionDef(control), this.getTextDef(value), '\n\n');
  }

  async generateRadioControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
    const source = await this.getControlSource(control);
    const layout = this.getControlLayout(control);

    this.docDefinition.content.push(this.getQuestionDef(control));
    if (layout.valuesOnly) {
      const answer = this.transformValueToLabel(value, source);
      this.docDefinition.content.push(this.getTextDef(answer));
    } else {
      this.docDefinition.content.push(this.getSelectDef(value, source, false, layout.columnCount));
    }
    this.docDefinition.content.push('\n\n');
  }

  async generateCheckControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
    const source = await this.getControlSource(control);

    const layout = this.getControlLayout(control);

    this.docDefinition.content.push(this.getQuestionDef(control));
    if (layout.valuesOnly) {
      const answer = this.transformValueToLabel(value, source);
      this.docDefinition.content.push(this.getTextDef(answer));
    } else {
      this.docDefinition.content.push(this.getSelectDef(value, source, true, layout.columnCount));
    }
    this.docDefinition.content.push('\n\n');
  }

  async generateDropdownControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
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
    this.docDefinition.content.push('\n\n');
  }

  generateImageControl(control, path = []) {
    const key = [...path, control.name, 'value'];
    const value = getProperty(this.submission.data, key);
    this.docDefinition.content.push(this.getQuestionDef(control), this.getImageDef(value), '\n\n');
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
          const dropdownVal = Array.isArray(value) ? value : value ? [value] : [];
          const dropdownSource = await this.getControlSource(col);
          const text = dropdownVal
            .map((val) => {
              const match = dropdownSource.find((s) => s.value === val);
              return match ? match.label || match.value : val;
            })
            .join(', ');
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

    this.docDefinition.content.push(
      this.getQuestionDef(control),
      {
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
      },
      '\n\n'
    );
  }

  getQuestionDef(control) {
    this.questionIndex += 1;

    return {
      text: `${this.questionIndex}. ${control.label || control.hint}`,
      style: 'question',
    };
  }

  getTextDef(answer, small = false, placeholder = 'No answer') {
    const value = this.getArrayValue(answer);
    const hasAnswer = value.length > 0;

    const d = {
      text: value.join(', ') || placeholder,
      color: hasAnswer ? styles.answer.color : styles.meta.color,
    };

    if (small) {
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
    const value = Array.isArray(answer) ? answer : answer ? [answer] : [];
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
        ul: columnOptions.map((option) => ({
          ...this.getTextDef(option.label),
          color: isChecked(option) ? 'blue' : styles.answer.color,
        })),
      })),
    };
  }

  getImageDef(answer) {
    if (answer.length === 0) {
      return this.getTextDef(answer);
    }

    const def = { ul: [] };

    answer.forEach((image) => {
      const ext = (image.split('.').pop() || '').toLowerCase();
      const isSupport = ['png', 'jpg', 'jpeg'].includes(ext);
      const url = getPublicDownloadUrl(image);
      const stack = [
        {
          text: image,
          link: url,
          style: 'link',
        },
      ];
      if (isSupport) {
        this.docDefinition.images[image] = url;
        stack.push({ image, fit: [300, 300], margin: [0, 8, 0, 8] });
      }
      def.ul.push({ stack });
    });

    return def;
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
      return await fetchSubmissionUniqueItems(resource.content.id, resource.content.path);
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
    };
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
