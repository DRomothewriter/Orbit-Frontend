import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type OrbitLoaderVariant =
  | 'singularity'
  | 'eclipse'
  | 'constellation'
  | 'pulsar'
  | 'astrolabe'
  | 'comet';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-orbit-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orbit-loader.component.html',
  styleUrl: './orbit-loader.component.scss',
})
export class OrbitLoaderComponent {
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: OrbitLoaderVariant = 'singularity';
  @Input() label?: string;
  @Input() fullArea = false;
  @Input() exiting = false;

  readonly skeletonRows = [0, 1, 2, 3, 4];
}
