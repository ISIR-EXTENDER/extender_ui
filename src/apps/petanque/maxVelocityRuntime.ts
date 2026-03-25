import type { ApplicationRuntimeMaxVelocityChangeArgs } from "../../app/runtime/types";
import {
  buildPetanqueCfgUpdate,
  isPetanqueMaxVelocityTopic,
  resolvePetanqueMaxVelocityPresentation,
} from "./controlRuntime";

export const handlePetanqueMaxVelocityChange = (
  args: ApplicationRuntimeMaxVelocityChangeArgs
) => {
  if (!isPetanqueMaxVelocityTopic(args.widget.topic)) {
    return null;
  }

  let value = args.nextValue;
  if (args.widget.topic === "/petanque_throw/alpha") {
    const { unsafeThreshold } = resolvePetanqueMaxVelocityPresentation(args.widget);
    if (typeof unsafeThreshold === "number" && value > unsafeThreshold) {
      if (!args.state.petanqueAlphaUnsafeValidated) {
        const confirmed = args.actions.confirmAction(
          `Alpha above ${unsafeThreshold} is not safe. Validate this value?`
        );
        if (!confirmed) {
          value = unsafeThreshold;
        } else {
          args.actions.setPetanqueAlphaUnsafeValidated(true);
        }
      }
    } else {
      args.actions.setPetanqueAlphaUnsafeValidated(false);
    }
  }

  const cfgUpdate = buildPetanqueCfgUpdate(args.widget.topic, value);
  if (cfgUpdate) {
    args.actions.sendMessage(cfgUpdate);
  }

  return { value };
};
