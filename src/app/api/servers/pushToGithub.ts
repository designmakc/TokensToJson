import { Octokit } from '@octokit/core';
import { t } from '@app/i18n';
import { splitTokensToFiles } from '@common/transform/splitTokensToFiles';

export const pushToGithub = async (
  credentials: GithubCredentialsI,
  tokens: any,
  toastCallback: (props: ToastIPropsI) => void,
  splitByCollection = false,
  splitByMode = false
) => {
  const ghToken = credentials.token;
  const owner = credentials.owner;
  const repo = credentials.repo;
  const branch = credentials.branch;
  const fileName = credentials.fileName;
  const commitMessage = credentials.commitMessage || 'Update tokens';

  const octokit = new Octokit({ auth: ghToken });

  // Build the list of files to commit
  let files: { path: string; content: string }[];
  if (splitByMode || splitByCollection) {
    // fileName acts as the target folder: "tokens.json" → "tokens/…"
    const dir = fileName.replace(/(\.tokens)?\.json$/, '');
    files = splitTokensToFiles(tokens, splitByCollection, splitByMode).map(
      (file) => ({
        path: dir ? `${dir}/${file.path}` : file.path,
        content: file.json,
      })
    );
  } else {
    files = [{ path: fileName, content: JSON.stringify(tokens, null, 2) }];
  }

  try {
    // Single commit with all files via the git tree API — creates or updates
    // files uniformly, no per-file sha handling.
    // ponytail: requires the branch to exist; empty repo → clear error toast.
    const baseRef = await octokit.request(
      'GET /repos/{owner}/{repo}/git/ref/{ref}',
      {
        owner,
        repo,
        ref: `heads/${branch}`,
      }
    );

    const tree = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
      owner,
      repo,
      base_tree: baseRef.data.object.sha,
      tree: files.map((file) => ({
        path: file.path,
        // mode 100644 is regular file
        mode: '100644' as const,
        type: 'blob' as const,
        content: file.content,
      })),
    });

    const commit = await octokit.request(
      'POST /repos/{owner}/{repo}/git/commits',
      {
        owner,
        repo,
        message: commitMessage,
        tree: tree.data.sha,
        parents: [baseRef.data.object.sha],
      }
    );

    await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.data.sha,
    });

    console.log(`Pushed ${files.length} file(s) to github`);
    toastCallback({
      title: t('Github: Updated successfully'),
      message: t('Tokens on Github have been updated successfully'),
      options: {
        type: 'success',
      },
    });
  } catch (error) {
    console.error('Error pushing tokens:', error);
    toastCallback({
      title: t('Github: An error occurred'),
      message:
        error.status === 404
          ? t(
              'Repository or branch not found. Check owner, repo and branch in settings.'
            )
          : error.message,
      options: {
        type: 'error',
      },
    });
  }
};
