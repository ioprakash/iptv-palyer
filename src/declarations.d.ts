declare module 'react-window' {
    import { ComponentType, CSSProperties, Key } from 'react';

    export interface ListProps {
        children: ComponentType<{ index: number; style: CSSProperties; data?: unknown }>;
        height: number;
        itemCount: number;
        itemSize: number | ((index: number) => number);
        width: number | string;
        className?: string;
        style?: CSSProperties;
        itemKey?: (index: number, data: unknown) => Key;
    }

    export class FixedSizeList extends React.Component<ListProps> { }
    export class VariableSizeList extends React.Component<ListProps> { }
}
