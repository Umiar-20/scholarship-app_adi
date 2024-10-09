import React from 'react';
import { Input } from '@/components/ui/input';

interface InputDateProps {
  label?: string;
  name?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const InputDate = ( props : InputDateProps) => {
  return (
    <div className="flex items-center gap-4">
      <label>
        {props.label}
        {':'}
      </label>
      <Input type="date" name={props.name} onChange={props.onChange}></Input>
    </div>
  );
};