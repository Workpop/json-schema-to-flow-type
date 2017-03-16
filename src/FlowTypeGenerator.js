// @flow

import _ from 'lodash';
import * as t from 'babel-types';

import {
  FlowSchema,
} from './FlowSchema';

type SchemaProcessorType = (flowSchema: FlowSchema) => Object;

export const upperCamelCase = (str: string): string => { return _.upperFirst(_.camelCase(str)); };

const optional = (astNode: any): Object =>  {
  return _.assign(astNode, { optional: true });
};

const processArraySchema = (flowSchema: FlowSchema, processor: SchemaProcessorType): Object =>  {
  return t.genericTypeAnnotation(
    t.identifier('Array'),
    t.typeParameterInstantiation([
      processor(flowSchema.flowType('any')),
    ]),
  );
};

const processObjectSchema = (flowSchema: FlowSchema, processor: SchemaProcessorType): Object => {
  const properties = _.map(
    flowSchema.$properties || {},
    (fieldFlowSchema: FlowSchema, field: string): any => {
      const ast = t.objectTypeProperty(
        t.identifier(field),
        processor(fieldFlowSchema),
      );

      if (_.includes(flowSchema.$required, field)) {
        return ast;
      }

      return optional(ast);
    },
  );

  return t.objectTypeAnnotation(
    properties,
    flowSchema.$union ? [
      t.objectTypeIndexer(
        t.identifier('key'),
        t.anyTypeAnnotation(),
        processor(flowSchema.flowType('any')),
      ),
    ] : null,
  );
};

export const toFlowType = (flowSchema: FlowSchema): Object => {
  if (flowSchema.$flowRef) {
    return t.identifier(upperCamelCase(flowSchema.$flowRef));
  }

  if (flowSchema.$enum) {
    return t.createUnionTypeAnnotation(
      _.map(
        flowSchema.$enum,
        (value: any): any => { return t.identifier(JSON.stringify(value)); },
      ),
    );
  }

  if (flowSchema.$flowType === 'Array') {
    return processArraySchema(flowSchema, toFlowType);
  }

  if (flowSchema.$flowType === 'Object') {
    return processObjectSchema(flowSchema, toFlowType);
  }

  if (flowSchema.$union) {
    return t.unionTypeAnnotation(_.map(flowSchema.$union, toFlowType));
  }

  if (flowSchema.$intersection) {
    return t.intersectionTypeAnnotation(_.map(flowSchema.$intersection, toFlowType));
  }


  if (flowSchema.$flowType === 'any') {
    return t.anyTypeAnnotation();
  }

  return t.createTypeAnnotationBasedOnTypeof(flowSchema.$flowType);
};
