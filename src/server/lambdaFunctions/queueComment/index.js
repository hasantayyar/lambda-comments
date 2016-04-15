import moment from 'moment'
import lambdaWrapper from '../../lib/lambdaWrapper'
import { generateReference } from '../../lib/references'
import { upload } from '../../lib/s3'
import { updateRecord } from '../../lib/dynamoDb'

function uploadJson({ dirName, actionRef, action }) {
  return upload({
    key: `${dirName}/${actionRef}/action.json`,
    data: JSON.stringify(action),
    contentType: 'application/json'
  })
}

export async function handler (...opts) {
  await lambdaWrapper(opts, async event => {
    const {
      url,
      commentContent,
      authorName,
      authorEmail,
      authorUrl,
      dryRun,
      quiet
    } = event
    if (!url) {
      throw new Error('Missing url')
    }
    if (!commentContent) {
      throw new Error('Missing commentContent')
    }
    const now = moment.utc()
    const actionRef = generateReference(now)
    const action = {
      type: 'NEW_COMMENT',
      actionRef,
      payload: {
        url,
        commentContent,
        authorName,
        authorEmail,
        authorUrl
      },
      submittedDate: now.toISOString()
    }
    if (!quiet) {
      console.log('actionRef:', actionRef)
      console.log('url:', url)
    }
    if (!dryRun) {
      await uploadJson({ dirName: 'jobs', actionRef, action })
      await updateRecord({ actionRef })
    }
    return action
  })
}
