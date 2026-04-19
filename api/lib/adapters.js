import { getTargetById } from './registry.js';

function californiaDropAdapter(job) {
  return {
    outcome: 'manual_handoff',
    message: 'California DROP is supported as a guided official flow. PrivacyGuard prepares the job, tracks it, and hands the user into the state portal.',
    nextSteps: [
      'Open the official California DROP portal',
      'Complete identity verification and submission',
      'Return to PrivacyGuard to mark the request complete'
    ],
    actionUrl: getTargetById('california_drop')?.actionUrl || '',
    automationLevel: 'guided_only'
  };
}

function manualBrokerTemplateAdapter(job) {
  const company = job.payload.companyName || 'the company';
  return {
    outcome: 'manual_template_ready',
    message: `PrivacyGuard prepared a manual broker request workflow for ${company}.`,
    nextSteps: [
      'Find the company privacy rights page',
      'Submit the prepared deletion or opt-out request manually',
      'Save confirmation and schedule follow-up'
    ],
    actionUrl: '',
    automationLevel: 'template_only'
  };
}

function privacyEmailWorkflowAdapter(job) {
  const company = job.payload.companyName || 'the company';
  const email = job.payload.privacyEmail || 'the company privacy contact';
  return {
    outcome: 'manual_email_ready',
    message: `PrivacyGuard prepared a privacy email workflow for ${company}.`,
    nextSteps: [
      `Send the prepared request to ${email}`,
      'Save a copy of the sent request',
      'Follow up if the company does not respond within the applicable window'
    ],
    actionUrl: '',
    automationLevel: 'template_only'
  };
}

export function runAdapter(job) {
  switch (job.targetId) {
    case 'california_drop':
      return californiaDropAdapter(job);
    case 'manual_broker_template':
      return manualBrokerTemplateAdapter(job);
    case 'privacy_email_workflow':
      return privacyEmailWorkflowAdapter(job);
    default:
      return {
        outcome: 'unsupported',
        message: 'This target is not supported yet. PrivacyGuard should route it to manual review.',
        nextSteps: ['Add the site to the registry', 'Create a reviewed adapter before claiming automation'],
        actionUrl: '',
        automationLevel: 'unsupported'
      };
  }
}
