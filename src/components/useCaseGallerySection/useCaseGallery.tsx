import { Features } from "../features"
import { features } from '@/data/casegallery'

export const UseCaseGallerySection = () => {
    return (
      <Features
        id="features"
        title="Use Case Gallery"
        columns={[1, 2, 3]}
        spacing={6}
        py={6}
        align="center"
        maxW="1800px"
        mx="auto"
        px={0}
        iconSize={3}
        maxFeatures={12}
        features={features}
      />
    )
  }