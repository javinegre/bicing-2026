import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AvailabilityBar from './AvailabilityBar.svelte';

describe('AvailabilityBar', () => {
  it('sizes each segment by share of capacity', () => {
    const { container } = render(AvailabilityBar, {
      props: { station: { mechanical: 12, electrical: 4, docks: 4 } },
    });

    const widths = [...container.querySelectorAll<HTMLElement>('.bar > div')].map(
      (el) => el.style.width,
    );
    expect(widths).toEqual(['60%', '20%', '20%']);
  });
});
