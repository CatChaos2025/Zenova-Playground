export const flexProps = {
    Flex: 'flex',
    InlineFlex: 'inline-flex',
    None: 'none',
} as const;

export type FlexType = typeof flexProps[keyof typeof flexProps];