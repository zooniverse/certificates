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

async function updateUserCertifcate() {
  userId = document.getElementById("userId").value;
  workflowId = document.getElementById("workflowId").value;
  const userContributionsInSeconds = await loadUserContributionsInSeconds(userId, workflowId)
  let userContributionsInHours = userContributionsInSeconds / (60.0 * 60.0)
  userContributionsInHours = userContributionsInHours.toFixed(4)
  document.getElementById('user-contributions').textContent = userContributionsInHours

}