import React from 'react'
import { Testimonial } from '../testimonials/testimonial'
import { Testimonials } from '../testimonials/testimonials'
import testimonials from '@/data/testimonials'

const TestimonialsSection = () => {
    return (
      <Testimonials
        title={testimonials.title}
        description="Hear from professionals who have accelerated their careers with our AI coach."
        columns={[1, 2, 3]}
        innerWidth="container.xl"
      >
        {testimonials.items.map((testimonial, i) => (
          <Testimonial key={i} {...testimonial} />
        ))}
      </Testimonials>
    )
  }

export default TestimonialsSection