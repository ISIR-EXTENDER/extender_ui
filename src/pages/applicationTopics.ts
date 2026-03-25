export const PETANQUE_STATE_TOPIC = "/petanque_state_machine/change_state";
export const PETANQUE_TOTAL_DURATION_TOPIC = "/petanque_throw/total_duration";
export const PETANQUE_ANGLE_TOPIC = "/petanque_throw/angle_between_start_and_finish";
export const PETANQUE_ALPHA_TOPIC = "/petanque_throw/alpha";
export const PETANQUE_ALPHA_PRESET_TOPIC = "/petanque_throw/alpha_preset";

export const TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC = "/teleop_config/translation_gain";
export const TELEOP_CONFIG_ROTATION_GAIN_TOPIC = "/teleop_config/rotation_gain";
export const TELEOP_CONFIG_LINEAR_SCALE_X_TOPIC = "/teleop_config/linear_scale_x";
export const TELEOP_CONFIG_LINEAR_SCALE_Y_TOPIC = "/teleop_config/linear_scale_y";
export const TELEOP_CONFIG_LINEAR_SCALE_Z_TOPIC = "/teleop_config/linear_scale_z";
export const TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC = "/teleop_config/angular_scale_x";
export const TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC = "/teleop_config/angular_scale_y";
export const TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC = "/teleop_config/angular_scale_z";
export const TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC = "/teleop_config/scale_x";
export const TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC = "/teleop_config/scale_y";
export const TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC = "/teleop_config/scale_z";
export const TELEOP_CONFIG_SWAP_XY_TOPIC = "/teleop_config/swap_xy";
export const TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC = "/teleop_config/invert_linear_x";
export const TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC = "/teleop_config/invert_linear_y";
export const TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC = "/teleop_config/invert_linear_z";
export const TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC = "/teleop_config/invert_angular_x";
export const TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC = "/teleop_config/invert_angular_y";
export const TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC = "/teleop_config/invert_angular_z";
export const TELEOP_CONFIG_RESET_TOPIC = "/teleop_config/reset_defaults";
export const TELEOP_CONFIG_SAVE_PROFILE_TOPIC = "/teleop_config/save_profile";

export const TELEOP_CONFIG_LINEAR_SCALE_X_TOPICS = new Set([
  TELEOP_CONFIG_LINEAR_SCALE_X_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC,
]);

export const TELEOP_CONFIG_LINEAR_SCALE_Y_TOPICS = new Set([
  TELEOP_CONFIG_LINEAR_SCALE_Y_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC,
]);

export const TELEOP_CONFIG_LINEAR_SCALE_Z_TOPICS = new Set([
  TELEOP_CONFIG_LINEAR_SCALE_Z_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC,
]);

const LOCAL_MAX_VELOCITY_TOPICS = new Set([
  "/cmd/max_velocity",
  TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC,
  TELEOP_CONFIG_ROTATION_GAIN_TOPIC,
  TELEOP_CONFIG_LINEAR_SCALE_X_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC,
  TELEOP_CONFIG_LINEAR_SCALE_Y_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC,
  TELEOP_CONFIG_LINEAR_SCALE_Z_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC,
  TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC,
  TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC,
  TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC,
  PETANQUE_TOTAL_DURATION_TOPIC,
  PETANQUE_ANGLE_TOPIC,
  PETANQUE_ALPHA_TOPIC,
]);

export const isTeleopLinearScaleXTopic = (topic: string) =>
  TELEOP_CONFIG_LINEAR_SCALE_X_TOPICS.has(topic);

export const isTeleopLinearScaleYTopic = (topic: string) =>
  TELEOP_CONFIG_LINEAR_SCALE_Y_TOPICS.has(topic);

export const isTeleopLinearScaleZTopic = (topic: string) =>
  TELEOP_CONFIG_LINEAR_SCALE_Z_TOPICS.has(topic);

export const isLocalMaxVelocityTopic = (topic: string) => LOCAL_MAX_VELOCITY_TOPICS.has(topic);
