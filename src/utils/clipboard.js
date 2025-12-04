export const copyToClipboard = (text, onSuccess) => {
  const textarea = document.createElement('textarea');
  textarea.value = text || '';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  } catch (err) {
    console.error('Failed to copy:', err);
  }
  document.body.removeChild(textarea);
};
