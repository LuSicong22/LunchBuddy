export const copyToClipboard = (text) => {
  const textarea = document.createElement('textarea');
  textarea.value = text || '';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    alert('已复制 ID！');
  } catch (err) {
    console.error('Failed to copy:', err);
  }
  document.body.removeChild(textarea);
};
