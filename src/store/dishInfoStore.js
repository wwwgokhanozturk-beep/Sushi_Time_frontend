import { create } from 'zustand';

// Окно «о блюде» одно на весь сайт (DishInfoSheet в App). Кнопки «i» на
// карточках только кладут сюда блюдо; opener — сама кнопка, чтобы после
// закрытия вернуть на неё фокус клавиатуры.
export const useDishInfoStore = create(() => ({ item: null, opener: null }));

export const openDishInfo = (item, opener = null) => useDishInfoStore.setState({ item, opener });

export const closeDishInfo = () => useDishInfoStore.setState({ item: null });
