import type { ReactNode } from 'react';
import { PRIMITIVES, type PrimitiveProps, type RenderContext } from './primitives';
import type { UINode } from './schema';

type AnyPrimitive = (props: PrimitiveProps<UINode['type']>) => ReactNode;

function UnknownPrimitive({ type }: { type: string }) {
  return (
    <div className="ui-unknown">
      The model composed a <code>{type}</code> here, but no primitive with that name is registered in{' '}
      <code>ui-tree/primitives.tsx</code>. Add one and this block renders.
    </div>
  );
}

export function UIRenderer({ node, ctx }: { node: UINode; ctx: RenderContext }) {
  const render = (child: UINode, key: number) => <UIRenderer key={key} node={child} ctx={ctx} />;
  const primitive = (PRIMITIVES as Record<string, AnyPrimitive | undefined>)[node.type];
  if (!primitive) return <UnknownPrimitive type={node.type} />;
  return <>{primitive({ node, ctx, render })}</>;
}
