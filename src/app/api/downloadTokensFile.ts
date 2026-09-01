// code to download a json object as a file
// https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser

import JSZip from 'jszip';
import { splitTokensToFiles } from '@common/transform/splitTokensToFiles';

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadTokensFile = async (
  objectToSave: Record<string, any>,
  splitByCollection = false,
  splitByMode = false
) => {
  if (splitByMode || splitByCollection) {
    const zip = new JSZip();
    for (const file of splitTokensToFiles(
      objectToSave,
      splitByCollection,
      splitByMode
    )) {
      zip.file(file.path, file.json);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, 'design.tokens.zip');
  } else {
    const json = JSON.stringify(objectToSave, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, 'design.tokens.json');
  }
};
