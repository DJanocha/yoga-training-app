import { createFormHook } from '@tanstack/react-form'

import {
  CheckboxGroup,
  NumberInput,
  Select,
  Slider,
  StringArrayInput,
  SubscribeButton,
  Switch,
  TextArea,
  TextField,
} from '@/components/form-fields'
import { fieldContext, formContext } from '@/hooks/form-context'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    TextArea,
    Select,
    Slider,
    Switch,
    NumberInput,
    CheckboxGroup,
    StringArrayInput,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
