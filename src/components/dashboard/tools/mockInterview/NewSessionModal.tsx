"use client";

import React, { useState } from 'react';
import { X, Calendar, Clock, Building2, Briefcase, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const NewSessionModal: React.FC<NewSessionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    duration: '30',
    company: '',
    role: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const interviewTypes = [
    { value: 'behavioral', label: 'Behavioral Interview', description: 'Situational questions and soft skills' },
    { value: 'technical', label: 'Technical Interview', description: 'Coding problems and technical knowledge' },
    { value: 'system-design', label: 'System Design', description: 'Architecture and scalability questions' },
    { value: 'case-study', label: 'Case Study', description: 'Business scenarios and problem solving' }
  ];

  const durations = ['15', '30', '45', '60', '90', '120'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Session title is required';
    }

    if (!formData.type) {
      newErrors.type = 'Interview type is required';
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const sessionDateTime = new Date(`${formData.date}T${formData.time}`);
    
    onSubmit({
      title: formData.title,
      type: formData.type,
      duration: parseInt(formData.duration),
      company: formData.company || undefined,
      role: formData.role || undefined,
      description: formData.description || undefined,
      date: sessionDateTime
    });

    // Reset form
    setFormData({
      title: '',
      type: '',
      duration: '30',
      company: '',
      role: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00'
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      title: '',
      type: '',
      duration: '30',
      company: '',
      role: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00'
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="text-green-600" size={20} />
            Create New Interview Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Session Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Session Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g., Senior Software Engineer Practice"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-300 focus:border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Interview Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {interviewTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    formData.type === type.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-1">{type.label}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
          </div>

          {/* Company and Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Building2 size={14} />
                Company
              </Label>
              <Input
                id="company"
                placeholder="e.g., Google, Microsoft"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Briefcase size={14} />
                Role
              </Label>
              <Input
                id="role"
                placeholder="e.g., Senior Software Engineer"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Clock size={14} />
              Duration *
            </Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
              <SelectTrigger className={errors.duration ? 'border-red-300 focus:border-red-500' : ''}>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durations.map((duration) => (
                  <SelectItem key={duration} value={duration}>
                    {duration} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.duration && <p className="text-sm text-red-600">{errors.duration}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar size={14} />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Clock size={14} />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Notes (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Any specific topics or focus areas for this session..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            Create Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSessionModal; 