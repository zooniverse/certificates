function statsHostURL(userId, workflowId) {
  return 'https://stats.zooniverse.org/counts/classification/year?user_id=' + userId + '&workflow_id=' + workflowId;
}
function sessionsHostURL(workflowId) {
  return 'http://127.0.0.1:8001/sessions.json?sql=select+*+from+stats+where+workflow_id+=+' + workflowId + '&_shape=array';
}

// Fetch the user contributions stats for this workflow
async function fetchUserClassifications(userId, workflowId) {
  const statsUserContributionsURL = statsHostURL(userId, workflowId);
  const statsResponse = await fetch(statsUserContributionsURL);
  const stats = await statsResponse.json();
  const classificationData = stats.events_over_time.buckets;
  return classificationData.reduce(function (store, data) {
    return store + data.doc_count;
  }, 0);
}

// Fetch the workflow session scores (mean, median, mode)
async function fetchWorkflowMedianTime(workflowId) {
  const sessionsWorkflowHostURL = sessionsHostURL(workflowId);
  const sessionsResponse = await fetch(sessionsWorkflowHostURL);
  const workflowSessionScores = await sessionsResponse.json();
  // data is first in the array (note the _shape=array URL param in sessionHostUrl)
  const workflowSessionData = workflowSessionScores[0]
  return workflowSessionData.median;
}

async function loadUserContributionsInSeconds(userId, workflowId) {
  const userClassifications = await fetchUserClassifications(userId, workflowId)
  // return early if we have no data
  if (userClassifications == 0) return userClassifications;
  const workflowMedianTime = await fetchWorkflowMedianTime(workflowId)
  // calculate the user's contributions based on the workflow median score
  const userContributionsInSeconds = workflowMedianTime * userClassifications;
  return userContributionsInSeconds;
}

/*
TODO: remove
async function updateUserCertifcate() {
  userId = document.getElementById("userId").value;
  workflowId = document.getElementById("workflowId").value;
  const userContributionsInSeconds = await loadUserContributionsInSeconds(userId, workflowId)
  let userContributionsInHours = userContributionsInSeconds / (60.0 * 60.0)
  userContributionsInHours = userContributionsInHours.toFixed(4)
  document.getElementById('user-contributions').textContent = userContributionsInHours
}
*/

const PANOPTES_OPTIONS = {
  headers: {
    'accept': 'application/vnd.api+json; version=1',
    'content-type': 'application/json'
  }
}

class ZooniverseCertificateApp {
  constructor () {
    //
    this.input = {
      username: null,
      projectURL: null
    }

    this.data = {
      user: undefined,
      project: undefined,
    }

    this.getInput()

    if (this.input.username && this.input.projectURL) {
      this.fetchData()
    }
  }

  /*
  Gets and saves user input.
   */
  getInput () {
    try {
      const params = (new URL(window.location)).searchParams
      this.input.username = params.get('username')
      this.input.projectURL = params.get('projectURL')
      // Note: returns null if query param doesn't exist

      // Sync the UI with the input
      document.getElementsByName('username')[0].value = this.input.username
      document.getElementsByName('projectURL')[0].value = this.input.projectURL
    } catch (err) {
      this.handleError(err)
    }
  }

  async fetchData () {
    await this.fetchUserData(this.input.username)
    await this.fetchProjectData(this.input.projectURL)

    try {
      const user = this.data.user
      const project = this.data.project
      if (!user || !project) throw new Error()

      const workflows = project?.links?.active_workflows || []

      let totalTime = 0
      for (let i = 0; i < workflows.length; i++) {
        const wfID = workflows[i]
        const wfTime = await loadUserContributionsInSeconds(user.id, wfID)
        totalTime += wfTime || 0
      }

      console.log('totalTime: ', totalTime)

    } catch (err) {
      // TODO
    }
  }

  async fetchUserData (username) {
    const _username = encodeURIComponent((username || '').trim())
    if (!_username) return
    const response = await fetch(`https://www.zooniverse.org/api/users?http_cache=true&login=${_username}`, PANOPTES_OPTIONS)
    if (response.ok) {
      const data = await response.json()
      this.data.user = data?.users?.[0]
      console.log('+++ user: ', this.data.user)
      // TODO: set status
    } else {
      // TODO: error
    }
  }

  async fetchProjectData (projectURL) {
    const projectRegex = /zooniverse.org\/projects\/([^\/]*\/[^\/]*)/i
    const projectSlug = projectURL.match(projectRegex)?.[1]
    const _projectSlug = encodeURIComponent((projectSlug || '').trim())

    const response = await fetch(`https://www.zooniverse.org/api/projects?http_cache=true&slug=${_projectSlug}`, PANOPTES_OPTIONS)
    if (response.ok) {
      const data = await response.json()
      this.data.project = data?.projects?.[0]
      console.log('+++ project', this.data.project)
      // TODO: set status

      const workflows = this.data.project?.links?.active_workflows || []

    } else {
      // TODO: error
    }
  }

  handleError (err) {
    console.error(err)
  }
}

function init () {
  console.log('xxx')
}

window.onload = function init() { window.zooApp = new ZooniverseCertificateApp() }
