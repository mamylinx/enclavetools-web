/**
 * Enclave Cookie Consent engine.
 * External file so it bypasses the strict hash-based CSP.
 * Implements Consent Mode v2 for Google Analytics.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "enclave_consent";
  var CONSENT_VERSION = 1;

  function initDataLayer() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  }

  function setDefaultConsent() {
    initDataLayer();
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500,
    });

    if (navigator.globalPrivacyControl) {
      window.gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  }

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(preferences) {
    var state = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      necessary: true,
      analytics: preferences.analytics === true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function updateGTAGConsent(preferences) {
    initDataLayer();
    window.gtag("consent", "update", {
      analytics_storage: preferences.analytics ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }

  function dispatchConsentEvent(preferences) {
    var event = new CustomEvent("enclave:consent-changed", {
      detail: preferences,
    });
    document.dispatchEvent(event);
  }

  function grantAll() {
    var state = writeConsent({ analytics: true });
    updateGTAGConsent(state);
    dispatchConsentEvent(state);
  }

  function denyAll() {
    var state = writeConsent({ analytics: false });
    updateGTAGConsent(state);
    dispatchConsentEvent(state);
  }

  function setPreferences(analytics) {
    var state = writeConsent({ analytics: analytics });
    updateGTAGConsent(state);
    dispatchConsentEvent(state);
  }

  function getState() {
    var state = readConsent();
    if (!state) return null;
    return {
      necessary: true,
      analytics: state.analytics === true,
    };
  }

  function hasConsented() {
    return readConsent() !== null;
  }

  function open() {
    var event = new CustomEvent("enclave:open-consent");
    document.dispatchEvent(event);
  }

  window.EnclaveConsent = {
    grantAll: grantAll,
    denyAll: denyAll,
    setPreferences: setPreferences,
    getState: getState,
    hasConsented: hasConsented,
    open: open,
  };

  setDefaultConsent();

  document.addEventListener("astro:page-load", function () {
    var state = readConsent();
    if (state) {
      updateGTAGConsent(state);
      dispatchConsentEvent(state);
    }
  });
})();
