export const osState = {
    highestZIndex: 10,
    use24HourTime: localStorage.getItem('use24HourTime') === 'true',
    systemClockInterval: null,
    isDragging: false,
    draggedWindow: null,
    offsetX: 0,
    offsetY: 0,
    currentDirectory: 'Root',
    openedNotepadFilePath: null,
    clipboard: {action: '', paths:[]},
    targetFileForMenu: null
};