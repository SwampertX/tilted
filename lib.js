// For implementation heuristics, see heuristics.md
// range: 0-90
const LR_TILT_THRES_DEG = 30;
// range: 0-100
const UP_EYE_NOSE_THRES_PCT = 70;
const UP_EAR_NOSE_THRES_PCT = 70;
// range: 0-100
const DOWN_TILT_THRES_PCT = 70;
const radToDeg = (rad) => (rad / Math.PI) * 180;
const percentageChange = (curr, ref) => ((curr - ref) / ref) * 100;
const atan2deg = (y, x) => radToDeg(Math.atan2(y, x));

/**
 * At the center is 0 degrees.
 * Person tilt right is positive, tilt left is negative.
 * @returns degrees of the turn.
 */
export function getTiltDeg(pose) {
  pose = rawPoseToPose(pose);
  if (!pose) return 0;
  const eyeAngle = atan2deg(
    pose.rightEye.y - pose.leftEye.y,
    pose.rightEye.x - pose.leftEye.x
  );
  const earAngle = atan2deg(
    pose.rightEar.y - pose.leftEar.y,
    pose.rightEar.x - pose.leftEar.x
  );
  return eyeAngle < 0 && earAngle < 0
    ? Math.min(eyeAngle, earAngle)
    : eyeAngle > 0 && earAngle > 0
    ? Math.max(eyeAngle, earAngle)
    : (eyeAngle + earAngle) / 2;
}

/**
 * @param pose being investigated
 * @param refPose resting pose for comparison
 * @returns a boolean, true if the person is tilting up.
 */
export function isTiltingUp(pose, restPose) {
  pose = rawPoseToPose(pose);
  restPose = rawPoseToPose(restPose);
  if (!pose || !restPose) {
    console.log('can\'t find pose or rest pose');
    return false;
  }
  const restEyeNoseDist =
    (restPose.leftEye.y -
      restPose.nose.y +
      restPose.rightEye.y -
      restPose.nose.y) /
    2;
  const eyeNoseDist =
    (pose.leftEye.y - pose.nose.y + pose.rightEye.y - pose.nose.y) / 2;
  const restEarNoseDist = (pose.leftEar.y + pose.rightEar.y) / 2 - pose.nose.y;
  const earNoseDist =
    (restPose.leftEar.y + restPose.rightEar.y) / 2 - restPose.nose.y;
  const percentageDecreaseInEyeNoseDist = -percentageChange(
    eyeNoseDist,
    restEyeNoseDist
  );
  const percentageIncreaseInEarNoseDist = percentageChange(
    earNoseDist,
    restEarNoseDist
  );
  return (
    percentageDecreaseInEyeNoseDist > UP_EYE_NOSE_THRES_PCT
    // percentageIncreaseInEarNoseDist > UP_EAR_NOSE_THRES_PCT
  );
}

/**
 * @param pose being investigated
 * @param refPose resting pose for comparison
 * @returns a boolean, true if the person is tilting up.
 */
export function isTiltingDown(pose, restPose) {
  pose = rawPoseToPose(pose);
  restPose = rawPoseToPose(restPose);
  if (!pose || !restPose) {
    console.log('can\'t find pose or rest pose');
    return false;
  }
  const restNoseShoulderDist =
    pose.nose.y - (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
  const noseShoulderDist =
    restPose.nose.y - (restPose.leftShoulder.y + restPose.rightShoulder.y) / 2;
  const percentageDecreaseInDist =
    ((noseShoulderDist - restNoseShoulderDist) / restNoseShoulderDist) * 100;
  // console.log('down');
  // console.log(percentageDecreaseInDist);
  return percentageDecreaseInDist > DOWN_TILT_THRES_PCT;
}

export function isTiltingLeft(rawPose) {
  const pose = rawPoseToPose(rawPose);
  if (!pose) return false;
  return getTiltDeg(pose) < -1 * LR_TILT_THRES_DEG;
}

export function isTiltingRight(rawPose) {
  const pose = rawPoseToPose(rawPose);
  if (!pose) return false;
  return getTiltDeg(pose) < LR_TILT_THRES_DEG;
}

function rawPoseToPose(rawPose) {
  if (!rawPose || !rawPose.keypoints) return null;
  return {
    nose: rawPose.keypoints[0].position,
    leftEye: rawPose.keypoints[1].position,
    rightEye: rawPose.keypoints[2].position,
    leftEar: rawPose.keypoints[3].position,
    rightEar: rawPose.keypoints[4].position,
    leftShoulder: rawPose.keypoints[5].position,
    rightShoulder: rawPose.keypoints[6].position,
  };
}
