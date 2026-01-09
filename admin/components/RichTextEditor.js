import React from 'react';
import ReactQuill from 'react-quill';
import { FormGroup, Label } from '@adminjs/design-system';

const RichTextEditor = (props) => {
  const { property, record, onChange } = props;
  const value = record?.params?.[property.name] || '';

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      [{ 'table': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'script', 'indent', 'blockquote', 'code-block',
    'color', 'background', 'align', 'link', 'table'
  ];

  const handleChange = (content) => {
    onChange(property.name, content);
  };

  return React.createElement(FormGroup, null,
    React.createElement(Label, null, property.label),
    React.createElement('div', { style: { backgroundColor: 'white' } },
      React.createElement(ReactQuill, {
        theme: 'snow',
        value: value,
        onChange: handleChange,
        modules: modules,
        formats: formats,
        placeholder: 'Enter rich text content...',
        style: { minHeight: '300px' }
      })
    )
  );
};

export default RichTextEditor;
