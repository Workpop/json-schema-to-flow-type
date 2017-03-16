// @flow

import * as t from 'babel-types';
import generate from 'babel-generator'; // eslint-disable-line import/no-extraneous-dependencies
import _ from 'lodash';

import type {
  Schema,
} from '../definitions/Schema';

import {
  simplifySchema,
} from './Schema';

import {
  convertSchema,
  FlowSchema,
} from './FlowSchema';

import {
  toFlowType,
  upperCamelCase,
} from './FlowTypeGenerator';

export {
  simplifySchema,
  convertSchema,
  toFlowType,
};

export const toFlow = (flowSchema: FlowSchema): Object =>  {
  return t.exportNamedDeclaration(
    t.typeAlias(
      t.identifier(upperCamelCase(flowSchema.$id)),
      null,
      toFlowType(flowSchema),
    ),
    [],
  );
};

export const schemaToFlow = (flowSchema: FlowSchema): string =>  {
  return _.map(
    [
      ...(_.map(flowSchema.$definitions, toFlow)),
      toFlow(flowSchema),
    ],
    (ast: Object): string => { return generate(ast).code; },
  ).join('\n\n');
};

export const parseSchema = (schema: Schema, imports: ?{ [key: string]: Schema }): string =>  {
  return _.flow(
    (s: Schema): Schema => { return simplifySchema(s, imports); },
    convertSchema,
    schemaToFlow,
  )(schema);
};
