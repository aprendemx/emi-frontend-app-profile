import React, {
  useEffect, useState, useContext, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { sendTrackingLogEvent } from '@edx/frontend-platform/analytics';
import { ensureConfig } from '@edx/frontend-platform';
import { AppContext } from '@edx/frontend-platform/react';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import {
  Alert, Hyperlink, OverlayTrigger, Tooltip,
} from '@openedx/paragon';
import { InfoOutline } from '@openedx/paragon/icons';
import classNames from 'classnames';

import {
  fetchProfile,
  saveProfile,
  saveProfilePhoto,
  deleteProfilePhoto,
  openForm,
  closeForm,
  updateDraft,
} from './data/actions';

import ProfileAvatar from './forms/ProfileAvatar';
import Name from './forms/Name';
import Country from './forms/Country';
import PreferredLanguage from './forms/PreferredLanguage';
import Education from './forms/Education';
import SocialLinks from './forms/SocialLinks';
import Bio from './forms/Bio';
import DateJoined from './DateJoined';
import UserCertificateSummary from './UserCertificateSummary';
import PageLoading from './PageLoading';
import Certificates from './Certificates';
import ProfileDashboard from './ProfileDashboard';
import Banner from './Banner';
import AgeMessage from './AgeMessage';

import { profilePageSelector } from './data/selectors';
import messages from './ProfilePage.messages';
import withParams from '../utils/hoc';
import { useIsOnMobileScreen, useIsOnTabletScreen } from './data/hooks';

import AdditionalProfileFieldsSlot from '../plugin-slots/AdditionalProfileFieldsSlot';

ensureConfig(['CREDENTIALS_BASE_URL', 'LMS_BASE_URL', 'ACCOUNT_SETTINGS_URL'], 'ProfilePage');

const ProfilePage = ({ params }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const context = useContext(AppContext);
  const {
    dateJoined,
    courseCertificates,
    name,
    visibilityName,
    profileImage,
    savePhotoState,
    isLoadingProfile,
    photoUploadError,
    country,
    visibilityCountry,
    levelOfEducation,
    visibilityLevelOfEducation,
    socialLinks,
    draftSocialLinksByPlatform,
    visibilitySocialLinks,
    languageProficiencies,
    visibilityLanguageProficiencies,
    bio,
    visibilityBio,
    saveState,
    username,
    requiresParentalConsent,
  } = useSelector(profilePageSelector);

  const navigate = useNavigate();
  const [viewMyRecordsUrl, setViewMyRecordsUrl] = useState(null);
  const isMobileView = useIsOnMobileScreen();
  const isTabletView = useIsOnTabletScreen();

  useEffect(() => {
    const { CREDENTIALS_BASE_URL } = context.config;
    if (CREDENTIALS_BASE_URL) {
      setViewMyRecordsUrl(`${CREDENTIALS_BASE_URL}/records`);
    }

    dispatch(fetchProfile(params.username));
    sendTrackingLogEvent('edx.profile.viewed', {
      username: params.username,
    });
  }, [dispatch, params.username, context.config]);

  useEffect(() => {
    if (!username && saveState === 'error' && navigate) {
      navigate('/notfound');
    }
  }, [username, saveState, navigate]);

  const authenticatedUserName = context.authenticatedUser.username;

  const handleSaveProfilePhoto = useCallback((formData) => {
    dispatch(saveProfilePhoto(authenticatedUserName, formData));
  }, [dispatch, authenticatedUserName]);

  const handleDeleteProfilePhoto = useCallback(() => {
    dispatch(deleteProfilePhoto(authenticatedUserName));
  }, [dispatch, authenticatedUserName]);

  const handleClose = useCallback((formId) => {
    dispatch(closeForm(formId));
  }, [dispatch]);

  const handleOpen = useCallback((formId) => {
    dispatch(openForm(formId));
  }, [dispatch]);

  const handleSubmit = useCallback((formId) => {
    dispatch(saveProfile(formId, authenticatedUserName));
  }, [dispatch, authenticatedUserName]);

  const handleChange = useCallback((fieldName, value) => {
    dispatch(updateDraft(fieldName, value));
  }, [dispatch]);

  const isAuthenticatedUserProfile = () => params.username === authenticatedUserName;

  const isBlockVisible = (blockInfo) => isAuthenticatedUserProfile()
      || (!isAuthenticatedUserProfile() && Boolean(blockInfo));

  const renderViewMyRecordsButton = () => {
    if (!(viewMyRecordsUrl && isAuthenticatedUserProfile())) {
      return null;
    }

    return (
      <Hyperlink
        className={classNames(
          'btn btn-brand bg-brand-500 font-weight-normal px-4 py-10px text-nowrap',
          { 'w-100': isMobileView },
        )}
        target="_blank"
        showLaunchIcon={false}
        destination={viewMyRecordsUrl}
      >
        {intl.formatMessage(messages['profile.viewMyRecords'])}
      </Hyperlink>
    );
  };

  const renderPhotoUploadErrorMessage = () => (
    photoUploadError && (
      <div className="row">
        <div className="col-md-4 col-lg-3">
          <Alert variant="danger" dismissible={false} show>
            {photoUploadError.userMessage}
          </Alert>
        </div>
      </div>
    )
  );

  const commonFormProps = {
    openHandler: handleOpen,
    closeHandler: handleClose,
    submitHandler: handleSubmit,
    changeHandler: handleChange,
  };

    // EMI: estadísticas para ProfileDashboard. Son estimaciones, no datos reales:
  // cursos = certificados, 36 h por curso, progreso sobre 8 cursos.
  const certificatesCount = courseCertificates ? courseCertificates.length : 0;
  const coursesCount = certificatesCount;
  const hoursCompleted = coursesCount * 36;
  const progressPercentage = Math.min(Math.round((coursesCount / 8) * 100), 100);

  return (
    <div className="profile-page">
      {isLoadingProfile ? (
        <PageLoading srMessage={intl.formatMessage(messages['profile.loading'])} />
      ) : (
        <>
          <Banner />
          <ProfileDashboard
            username={username}
            dateJoined={dateJoined}
            coursesCount={coursesCount}
            certificatesCount={certificatesCount}
            hoursCompleted={hoursCompleted}
            progressPercentage={progressPercentage}
            profileImage={profileImage}
            courseCertificates={courseCertificates}
          />
          {renderPhotoUploadErrorMessage()}
          <div className="profile-content-sections">
            <div className="profile-main-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
              {isBlockVisible((courseCertificates || []).length) && (
                <div className="certificates-container">
                  <div className="certificates-layout">
                    <div className="courses-section">
                      <h2 className="section-title">Cursos</h2>
                      <div className="courses-content" />
                    </div>
                    <div className="certificates-section">
                      <div className="courses-right">
                        <div className="certificates-preview">
                          <div className="certificates-header">
                            <h3 className="certificates-title">Mis certificados</h3>
                            <span className="certificates-count">{certificatesCount}</span>
                          </div>
                          <div className="certificates-list">
                            {certificatesCount > 0 ? (
                              courseCertificates.slice(0, 5).map((certificate, idx) => (
                                <div key={certificate.courseId || idx} className="certificate-item">
                                  <div className="certificate-info">
                                    <h4 className="certificate-name">{certificate.courseDisplayName}</h4>
                                    <p className="certificate-org">{certificate.courseOrganization}</p>
                                  </div>
                                  <a
                                    href={certificate.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="certificate-link"
                                  >
                                    Ver
                                  </a>
                                </div>
                              ))
                            ) : (
                              <div className="no-certificates">No hay certificados disponibles</div>
                            )}
                            {certificatesCount > 5 && (
                              <div className="view-all">
                                <span>+{certificatesCount - 5} más</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                    {requiresParentalConsent && isAuthenticatedUserProfile() && (
                    <div className="age-message-container">
                      <AgeMessage accountSettingsUrl={context.config.ACCOUNT_SETTINGS_URL} />
                    </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

ProfilePage.propTypes = {
  params: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }).isRequired,
  requiresParentalConsent: PropTypes.bool,
  dateJoined: PropTypes.string,
  username: PropTypes.string,
  bio: PropTypes.string,
  visibilityBio: PropTypes.string,
  courseCertificates: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string,
  })),
  country: PropTypes.string,
  visibilityCountry: PropTypes.string,
  levelOfEducation: PropTypes.string,
  visibilityLevelOfEducation: PropTypes.string,
  languageProficiencies: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string.isRequired,
  })),
  visibilityLanguageProficiencies: PropTypes.string,
  name: PropTypes.string,
  visibilityName: PropTypes.string,
  socialLinks: PropTypes.arrayOf(PropTypes.shape({
    platform: PropTypes.string,
    socialLink: PropTypes.string,
  })),
  draftSocialLinksByPlatform: PropTypes.objectOf(PropTypes.shape({
    platform: PropTypes.string,
    socialLink: PropTypes.string,
  })),
  visibilitySocialLinks: PropTypes.string,
  profileImage: PropTypes.shape({
    src: PropTypes.string,
    isDefault: PropTypes.bool,
  }),
  saveState: PropTypes.oneOf([null, 'pending', 'complete', 'error']),
  savePhotoState: PropTypes.oneOf([null, 'pending', 'complete', 'error']),
  isLoadingProfile: PropTypes.bool,
  photoUploadError: PropTypes.objectOf(PropTypes.string),
};

ProfilePage.defaultProps = {
  saveState: null,
  username: '',
  savePhotoState: null,
  photoUploadError: {},
  profileImage: {},
  name: null,
  levelOfEducation: null,
  country: null,
  socialLinks: [],
  draftSocialLinksByPlatform: {},
  bio: null,
  languageProficiencies: [],
  courseCertificates: [],
  requiresParentalConsent: null,
  dateJoined: null,
  visibilityName: null,
  visibilityCountry: null,
  visibilityLevelOfEducation: null,
  visibilitySocialLinks: null,
  visibilityLanguageProficiencies: null,
  visibilityBio: null,
  isLoadingProfile: false,
};

export default withParams(ProfilePage);
